import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
if (!process.env.FIRESTORE_EMULATOR_HOST)
  throw new Error("Emulator required; never run against production");
process.env.GCLOUD_PROJECT = "demo-oszczedzify";
const {
  database,
  OfferRepository,
  offerId,
} = require("../functions/lib/bond-offers/repository");
const { serveOffers } = require("../functions/lib/bond-offers/http");
const seed = require("../functions/lib/treasury-bonds/treasury-bonds.offer.json");
const db = database();
const repo = new OfferRepository(db);
const base = `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/demo-oszczedzify/databases/(default)/documents`;
// Anonymous REST must not read or write data; Admin SDK below bypasses rules through IAM.
for (const method of ["GET", "PATCH", "DELETE"]) {
  const r = await fetch(`${base}/bondOfferCatalog/months`, {
    method,
    ...(method === "PATCH"
      ? {
          headers: { "content-type": "application/json" },
          body: '{"fields":{}}',
        }
      : {}),
  });
  assert.equal(r.status, 403, method);
}
const ids = await Promise.all(
  Array.from({ length: 5 }, () => repo.publish(seed, { test: true })),
);
assert.equal(new Set(ids).size, 1);
assert.equal((await repo.catalog()).length, 1);
const correction = structuredClone(seed);
correction.bonds.EDO.firstPeriodRate = 0.06;
const revised = await repo.publish(correction, { test: true });
assert.notEqual(revised, ids[0]);
await repo.publish(seed, { retry: true });
assert.equal(
  (await repo.catalog())[0].offerId,
  revised,
  "old retry must not revert correction",
);
assert.equal(
  (await repo.get(ids[0])).bonds.EDO.firstPeriodRate,
  seed.bonds.EDO.firstPeriodRate,
);
const delayed = structuredClone(seed);
delayed.bonds.TOS.firstPeriodRate = 0.045;
await repo.publish(delayed, { observedAt: "2020-01-01T00:00:00.000Z" });
assert.equal(
  (await repo.catalog())[0].offerId,
  revised,
  "older concurrent observation must not replace newer data",
);
await repo.activate(ids[0]);
assert.equal((await repo.catalog())[0].offerId, ids[0]);
await repo.withdraw(revised, "test incorrect source");
await assert.rejects(
  () => repo.get(revised),
  (e) => e.status === 410,
);
await assert.rejects(() => repo.activate(revised));
await assert.rejects(
  () => repo.publish(correction, {}),
  (e) => e.status === 410,
);
await assert.rejects(
  () => repo.get("2026-10-" + "0".repeat(24)),
  (e) => e.status === 404,
);
await assert.rejects(() => repo.publish({ ...seed, bonds: {} }, {}));
assert.equal((await repo.catalog())[0].offerId, ids[0]);
let response;
const res = {
  setHeader() {},
  status(code) {
    this.code = code;
    return this;
  },
  send(body) {
    response = { code: this.code, body };
  },
};
await serveOffers({ query: { action: "offer", offerId: offerId(seed) } }, res);
assert.equal(response.code, 200);
assert.equal(response.body.data.offerId, ids[0]);
await serveOffers({ query: { action: "catalog" } }, res);
assert.equal(response.code, 200);
assert.equal(response.body.data.entries.length, 1);
await serveOffers({ query: { action: "offer", offerId: "invalid" } }, res);
assert.equal(response.code, 400);
console.log(
  "PASS: rules, concurrent publication, deduplication, corrections, rollback, withdrawal and HTTP read API",
);
await db.terminate();
