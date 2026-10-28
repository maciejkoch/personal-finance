import { getStorage } from "firebase-admin/storage";
import { INFLATION_SOURCE } from "../contracts/inflation";
import { database } from "../http/database";
import {
  checkedSourceUrl,
  discoverCsv,
  parseInflation,
  parserVersion,
} from "./parser";
import { digest, InflationRepository } from "./repository";

export async function fetchGus(url: string): Promise<Buffer> {
  checkedSourceUrl(url);
  let failure: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // A redirect is never followed without validating its destination.
      let target = url;
      for (let redirects = 0; redirects < 4; redirects++) {
        const response = await fetch(target, {
          redirect: "manual",
          signal: AbortSignal.timeout(20000),
        });
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          await response.body?.cancel();
          target = checkedSourceUrl(
            new URL(response.headers.get("location") || "", target).href,
          );
          continue;
        }
        if (!response.ok || !response.body)
          throw new Error(`GUS HTTP ${response.status}`);
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let size = 0;
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.length;
            if (size > 2 * 1024 * 1024) throw new Error("GUS source too large");
            chunks.push(value);
          }
        } finally {
          await reader.cancel();
        }
        return Buffer.concat(chunks);
      }
      throw new Error("Too many source redirects");
    } catch (error) {
      failure = error;
    }
  }
  throw failure;
}
export async function importInflation(write = false) {
  const repo = write ? new InflationRepository() : undefined;
  const token = await repo?.acquire();
  try {
    const sourceFileUrl = discoverCsv(
      (await fetchGus(INFLATION_SOURCE)).toString("utf8"),
    );
    const bytes = await fetchGus(sourceFileUrl);
    const evidence = {
      sourceFileUrl,
      sourceSha256: digest(bytes),
      fetchedAt: new Date().toISOString(),
      parserVersion,
    };
    if (write) {
      database();
      const bucket =
        process.env.INFLATION_SOURCE_BUCKET || process.env.BOND_SOURCE_BUCKET;
      if (!bucket)
        throw new Error(
          "INFLATION_SOURCE_BUCKET or BOND_SOURCE_BUCKET required",
        );
      try {
        await getStorage()
          .bucket(bucket)
          .file(`inflation-sources/${evidence.sourceSha256}.csv`)
          .save(bytes, {
            resumable: false,
            contentType: "text/csv; charset=windows-1250",
            preconditionOpts: { ifGenerationMatch: 0 },
          });
      } catch (error) {
        if ((error as { code?: number }).code !== 412) throw error;
      }
    }
    const today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Warsaw",
    }).format(new Date());
    const points = parseInflation(bytes, today);
    const datasetId =
      repo && token
        ? await repo.publish(points, evidence, token)
        : digest(JSON.stringify(points));
    return {
      datasetId,
      count: points.length,
      first: points[0],
      latest: points[points.length - 1],
      evidence,
    };
  } catch (error) {
    if (repo && token)
      await database()
        .doc("inflationImportStatus/current")
        .set(
          {
            checkedAt: new Date().toISOString(),
            outcome: "failed",
            message: error instanceof Error ? error.message : "Import failed",
          },
          { merge: true },
        );
    throw error;
  } finally {
    if (repo && token) await repo.release(token);
  }
}
