import { createHash, randomUUID } from "node:crypto";
import { database } from "../http/database";
import {
  currentInflationSchema,
  datasetIdSchema,
  INFLATION_SOURCE,
  inflationFreshness,
  pointsSchema,
  type InflationPoint,
} from "../contracts/inflation";

export const digest = (v: string | Buffer) =>
  createHash("sha256").update(v).digest("hex");
export class InflationError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export interface Evidence {
  sourceFileUrl: string;
  sourceSha256: string;
  fetchedAt: string;
  parserVersion: string;
}
export class InflationRepository {
  constructor(private readonly db = database()) {}
  async acquire(): Promise<string> {
    const token = randomUUID();
    await this.db.runTransaction(async (tx) => {
      const ref = this.db.doc("inflationImportStatus/lease");
      const snap = await tx.get(ref);
      if ((snap.data()?.expiresAt ?? 0) > Date.now())
        throw new Error("Inflation import already running");
      tx.set(ref, { token, expiresAt: Date.now() + 600000 });
    });
    return token;
  }
  async release(token: string): Promise<void> {
    await this.db.runTransaction(async (tx) => {
      const ref = this.db.doc("inflationImportStatus/lease");
      if ((await tx.get(ref)).data()?.token === token) tx.delete(ref);
    });
  }
  async publish(
    input: InflationPoint[],
    evidence: Evidence,
    token: string,
  ): Promise<string> {
    const points = pointsSchema.parse(input);
    // Bounded complete snapshots fit safely below Firestore's document limit.
    if (Buffer.byteLength(JSON.stringify(points)) > 600000)
      throw new Error("Dataset too large");
    const id = digest(JSON.stringify(points));
    const latest = points[points.length - 1];
    await this.db.runTransaction(async (tx) => {
      const ref = this.db.doc(`inflationDatasets/${id}`);
      const current = this.db.doc("inflationCatalog/current");
      const [lease, existing, active] = await Promise.all([
        tx.get(this.db.doc("inflationImportStatus/lease")),
        tx.get(ref),
        tx.get(current),
      ]);
      if (lease.data()?.token !== token || lease.data()?.expiresAt < Date.now())
        throw new Error("Import lease expired");
      if (existing.data()?.withdrawn) throw new Error("Dataset withdrawn");
      const previous = active.data();
      if (previous && latest.period < previous.point.period)
        throw new Error("Source would move current period backwards");
      if (previous?.datasetId && previous.datasetId !== id) {
        const old = await tx.get(
          this.db.doc(`inflationDatasets/${previous.datasetId}`),
        );
        const periods = new Set(points.map((p) => p.period));
        if (
          pointsSchema
            .parse(old.data()?.points)
            .some((p) => !periods.has(p.period))
        )
          throw new Error("Source lost previously published observations");
      }
      // Previously published snapshots cannot silently undo a correction on retry.
      if (existing.exists && previous?.datasetId !== id)
        throw new Error("Old revision requires explicit activation");
      if (!existing.exists)
        tx.create(ref, {
          points,
          evidence,
          createdAt: new Date().toISOString(),
          withdrawn: false,
        });
      tx.set(current, {
        datasetId: id,
        point: latest,
        sourcePageUrl: INFLATION_SOURCE,
      });
      tx.set(this.db.doc("inflationImportStatus/current"), {
        checkedAt: new Date().toISOString(),
        lastSuccessAt: new Date().toISOString(),
        outcome: previous?.datasetId === id ? "unchanged" : "updated",
        datasetId: id,
      });
      tx.set(this.db.doc(`inflationImportRuns/${evidence.sourceSha256}`), {
        ...evidence,
        datasetId: id,
      });
    });
    return id;
  }
  async current() {
    const [active, status] = await this.db.getAll(
      this.db.doc("inflationCatalog/current"),
      this.db.doc("inflationImportStatus/current"),
    );
    if (!active.exists || !status.data()?.lastSuccessAt)
      throw new InflationError(503, "Inflation unavailable");
    const value = active.data()!;
    const checkedAt = status.data()!.lastSuccessAt as string;
    return currentInflationSchema.parse({
      schemaVersion: 1,
      series: "PL_CPI_ALL_YOY",
      ...value,
      readingId: `${value.point.period}-${digest(JSON.stringify(value.point))}`,
      checkedAt,
      ...inflationFreshness(value.point.period, checkedAt),
    });
  }
  async history(
    id?: string,
  ): Promise<{ datasetId: string; points: InflationPoint[] }> {
    const datasetId = id ?? (await this.current()).datasetId;
    datasetIdSchema.parse(datasetId);
    const snap = await this.db.doc(`inflationDatasets/${datasetId}`).get();
    if (!snap.exists) throw new InflationError(404, "Dataset not found");
    if (snap.data()?.withdrawn)
      throw new InflationError(410, "Dataset withdrawn");
    const points = pointsSchema.parse(snap.data()?.points);
    if (digest(JSON.stringify(points)) !== datasetId)
      throw new Error("Corrupt dataset");
    return { datasetId, points };
  }
  async activate(id: string): Promise<void> {
    const token = await this.acquire();
    try {
      const { points } = await this.history(id);
      await this.db
        .doc("inflationCatalog/current")
        .set({
          datasetId: id,
          point: points[points.length - 1],
          sourcePageUrl: INFLATION_SOURCE,
        });
      // Keep the existing last successful source check; rollback is not a source check.
    } finally {
      await this.release(token);
    }
  }
  async withdraw(id: string, reason: string): Promise<void> {
    datasetIdSchema.parse(id);
    if (!reason.trim()) throw new Error("Reason required");
    const token = await this.acquire();
    try {
      await this.db.runTransaction(async (tx) => {
        const ref = this.db.doc(`inflationDatasets/${id}`);
        const active = this.db.doc("inflationCatalog/current");
        const [dataset, current] = await Promise.all([
          tx.get(ref),
          tx.get(active),
        ]);
        if (!dataset.exists) throw new Error("Dataset not found");
        tx.update(ref, { withdrawn: true, withdrawalReason: reason });
        if (current.data()?.datasetId === id) tx.delete(active);
      });
    } finally {
      await this.release(token);
    }
  }
}
