import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
if (!process.env.FIRESTORE_EMULATOR_HOST)
  throw new Error("Firestore emulator required");
process.env.GCLOUD_PROJECT = "demo-oszczedzify";
const { database } = require("../functions/lib/http/database");
const {
  InflationRepository,
} = require("../functions/lib/inflation/repository");
const { parseInflation } = require("../functions/lib/inflation/parser");
const { serveInflation } = require("../functions/lib/inflation/http");
const db = database(),
  repo = new InflationRepository(db);
const points = parseInflation(
  readFileSync(
    new URL(
      "../functions/src/inflation/fixtures/gus-2026-10.csv",
      import.meta.url,
    ),
  ),
  "2026-10-28",
);
const evidence = {
  sourceFileUrl: "https://publikacje.new.stat.gov.pl/test.csv",
  sourceSha256: "a".repeat(64),
  fetchedAt: "2026-10-28T08:00:00.000Z",
  parserVersion: "test",
};
async function publish(p) {
  const token = await repo.acquire();
  try {
    return await repo.publish(p, evidence, token);
  } finally {
    await repo.release(token);
  }
}
let output;
const response = {
  setHeader() {},
  status(code) {
    this.code = code;
    return this;
  },
  send(body) {
    output = { code: this.code, body };
  },
};
const request = async (query = {}, method = "GET") => {
  await serveInflation({ query, method }, response);
  return output;
};
assert.equal((await request()).code, 503);
const acquired = await repo.acquire();
await assert.rejects(() => repo.acquire(), /already running/);
await repo.release(acquired);
const initial = await publish(points);
assert.equal(initial, await publish(points));
const correction = structuredClone(points);
correction.at(-1).indexValue = 104.2;
correction.at(-1).ratePercent = 4.2;
const revised = await publish(correction);
assert.notEqual(initial, revised);
await assert.rejects(() => publish(points), /explicit activation/);
assert.equal((await repo.current()).datasetId, revised);
await assert.rejects(() => publish(correction.slice(0, -1)), /backwards/);
await assert.rejects(() => publish(correction.slice(1)), /lost previously/);
await assert.rejects(
  () => repo.publish(points, evidence, "expired-token"),
  /lease expired/,
);
let cursor,
  read = [];
do {
  const result = await request({
    action: "history",
    datasetId: initial,
    ...(cursor ? { cursor } : {}),
  });
  assert.equal(result.code, 200);
  assert.equal(result.body.data.datasetId, initial);
  read.push(...result.body.data.points);
  cursor = result.body.data.nextCursor;
} while (cursor);
assert.deepEqual(
  read,
  points,
  "old generation remains stable across pages after correction",
);
assert.equal(
  (await request({ action: "history", datasetId: revised })).body.data.points
    .length,
  250,
);
assert.equal((await request()).body.data.point.ratePercent, 4.2);
for (const query of [
  { action: "bad" },
  { from: "2026-13" },
  { action: "history", from: "2026-09", to: "2026-01" },
  { datasetId: "../bad" },
])
  assert.equal((await request(query)).code, 400);
assert.equal((await request({}, "POST")).code, 405);
await db
  .doc("inflationImportStatus/current")
  .set(
    { outcome: "failed", checkedAt: new Date().toISOString() },
    { merge: true },
  );
assert.equal(
  (await request()).code,
  200,
  "failed import preserves previous successful data",
);
await repo.activate(initial);
assert.equal((await repo.current()).datasetId, initial);
await repo.withdraw(revised, "test incorrect correction");
assert.equal(
  (await request({ action: "history", datasetId: revised })).code,
  410,
);
await assert.rejects(() => repo.activate(revised));
await repo.withdraw(initial, "test active withdrawal");
assert.equal((await request()).code, 503);
const base = `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/demo-oszczedzify/databases/(default)/documents`;
for (const path of [
  "inflationCatalog/current",
  `inflationDatasets/${initial}`,
  "inflationImportStatus/current",
]) {
  for (const method of ["GET", "PATCH", "DELETE"]) {
    const r = await fetch(`${base}/${path}`, {
      method,
      ...(method === "PATCH"
        ? {
            headers: { "content-type": "application/json" },
            body: '{"fields":{}}',
          }
        : {}),
    });
    assert.equal(r.status, 403, `${method} ${path}`);
  }
}
console.log(
  "PASS: inflation lease, idempotency, corrections, immutable pagination, source truncation, rollback, withdrawal, API and rules",
);
await db.terminate();
