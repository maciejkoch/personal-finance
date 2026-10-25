import { PDFParse } from "pdf-parse";
import { getStorage } from "firebase-admin/storage";
import { bondTypes } from "../contracts/bond-offer";
import {
  discoverSeries,
  findPdf,
  Letter,
  parseLetters,
  parserVersion,
} from "./parser";
import { database, hash, OfferRepository, warsawDate } from "./repository";

const origin = "https://www.obligacjeskarbowe.pl";
export async function fetchSource(url: string): Promise<Buffer> {
  const parsed = new URL(url);
  if (parsed.origin !== origin) throw new Error("Unexpected source host");
  let failure: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        redirect: "error",
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok || !response.body)
        throw new Error(`Source HTTP ${response.status}`);
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > 8 * 1024 * 1024) throw new Error("Source too large");
          chunks.push(value);
        }
      } finally {
        await reader.cancel();
      }
      return Buffer.concat(chunks);
    } catch (error) {
      failure = error;
    }
  }
  throw failure;
}
export async function importMonth(
  month: string,
  dryRun = true,
  archive = true,
) {
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))
    throw new Error("Invalid month");
  const observedAt = new Date().toISOString();
  let sourcePath = "/listy-emisyjne/";
  let html = (await fetchSource(`${origin}${sourcePath}`)).toString();
  let series;
  try {
    series = discoverSeries(html, month);
  } catch {
    sourcePath = "/archiwum-listow-emisyjnych/";
    html = (await fetchSource(`${origin}${sourcePath}`)).toString();
    series = discoverSeries(html, month);
  }
  const letters: Letter[] = [];
  for (const type of bondTypes) {
    const detail = (
      await fetchSource(
        `${origin}${sourcePath}?id=${series[type].toLowerCase()}`,
      )
    ).toString();
    const url = findPdf(detail);
    const bytes = await fetchSource(url);
    if (bytes.subarray(0, 5).toString() !== "%PDF-")
      throw new Error("Invalid PDF");
    const sha256 = hash(bytes);
    // Archive before parsing so rejected legal changes can be inspected.
    if (!dryRun && archive) {
      database();
      const bucket = process.env.BOND_SOURCE_BUCKET;
      if (!bucket)
        throw new Error("BOND_SOURCE_BUCKET is required for live import");
      try {
        await getStorage()
          .bucket(bucket)
          .file(`bond-sources/${sha256}.pdf`)
          .save(bytes, {
            resumable: false,
            contentType: "application/pdf",
            preconditionOpts: { ifGenerationMatch: 0 },
          });
      } catch (error) {
        if ((error as { code?: number }).code !== 412) throw error;
      }
    }
    const parser = new PDFParse({ data: bytes });
    try {
      letters.push({ type, url, sha256, text: (await parser.getText()).text });
    } finally {
      await parser.destroy();
    }
  }
  const offer = parseLetters(letters, warsawDate());
  if (offer.month !== month) throw new Error("Source month mismatch");
  const evidence = {
    parserVersion,
    observedAt,
    fetchedAt: new Date().toISOString(),
    sources: letters.map(({ type, url, sha256 }) => ({ type, url, sha256 })),
  };
  if (dryRun) return { offer, evidence };
  return {
    offer,
    evidence,
    offerId: await new OfferRepository().publish(offer, evidence),
  };
}
export async function syncOffers(): Promise<void> {
  const db = database();
  const today = warsawDate();
  const next = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const months = [today.slice(0, 7), next.toISOString().slice(0, 7)];
  const index = (await fetchSource(`${origin}/listy-emisyjne/`)).toString();
  const errors: string[] = [];
  for (const month of months) {
    try {
      // Future month may not yet be published. A partial set is not published.
      if (month > today.slice(0, 7)) {
        try {
          discoverSeries(index, month);
        } catch {
          continue;
        }
      }
      const result = await importMonth(month, false);
      const auditId = hash(JSON.stringify(result.evidence.sources));
      const audit = db.doc(`bondImportRuns/${month}-${auditId}`);
      await db.runTransaction(async (tx) => {
        const existing = await tx.get(audit);
        if (!existing.exists)
          tx.create(audit, {
            ...result.evidence,
            month,
            offerId: result.offerId,
          });
      });
      await db.doc(`bondImportStatus/${month}`).set({
        success: true,
        checkedAt: new Date().toISOString(),
        offerId: result.offerId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      await db
        .doc(`bondImportStatus/${month}`)
        .set({ success: false, checkedAt: new Date().toISOString(), message });
      errors.push(`${month}: ${message}`);
    }
  }
  if (errors.length) throw new Error(errors.join("; "));
}
