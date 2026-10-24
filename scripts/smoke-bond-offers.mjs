import assert from "node:assert/strict";
const production = process.argv.includes("--production");
const project =
  process.env.OSZCZEDZIFY_EMULATOR_PROJECT ?? "personal-finance-2ee61";
const base = production
  ? "https://europe-central2-personal-finance-2ee61.cloudfunctions.net"
  : `http://127.0.0.1:5001/${project}/europe-central2`;
const endpoint = `${base}/calculateTreasuryBondsWarsaw`;
const get = async (params) => {
  const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`, {
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 200);
  return (await response.json()).data;
};
const catalog = await get({ action: "catalog" });
assert.ok(catalog.currentOfferId, "Seed an offer first");
const offer = await get({ action: "offer", offerId: catalog.currentOfferId });
const result = await get({
  offerId: offer.offerId,
  contractVersion: "4",
  familyEligible: "true",
  numberOfBonds: "1",
  month: "36",
  inflation: "[0.035]",
  referenceRate: "[0.04]",
  savingsRate: "[0]",
});
assert.equal(result.contractVersion, 4);
assert.equal(result.offerId, offer.offerId);
assert.equal(result.offerVersion, offer.version);
assert.equal(result.series.length, 7);
assert.ok(result.series.every((series) => series.points.length === 36));
const missing = await fetch(
  `${endpoint}?action=offer&offerId=2000-01-${"0".repeat(24)}`,
);
assert.equal(missing.status, 404);
console.log(
  `PASS: live catalog -> offer -> pinned v4 calculation (${offer.month})`,
);
