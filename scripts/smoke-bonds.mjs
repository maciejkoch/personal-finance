import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const offer = JSON.parse(
  readFileSync(
    new URL(
      "../functions/src/treasury-bonds/treasury-bonds.offer.json",
      import.meta.url,
    ),
  ),
);
const host = process.argv.includes("--production")
  ? "https://us-central1-personal-finance-2ee61.cloudfunctions.net"
  : `http://127.0.0.1:5001/${process.env.OSZCZEDZIFY_EMULATOR_PROJECT ?? "personal-finance-2ee61"}/us-central1`;
const query = {
  numberOfBonds: "1",
  month: "144",
  inflation: "[0.035]",
  referenceRate: "[0.04]",
  savingsRate: "[0]",
};
async function call(overrides = {}, status = 200) {
  const response = await fetch(
    `${host}/calculateTreasuryBondsHttpFunction?${new URLSearchParams({ ...query, ...overrides })}`,
    {
      headers: { Origin: "http://localhost:4200" },
      signal: AbortSignal.timeout(30000),
    },
  );
  assert.equal(response.status, status);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "http://localhost:4200",
  );
  if (status !== 200) return;
  const body = await response.json();
  assert.equal(body.data.offerVersion, offer.version);
  assert.equal(body.data.calculationVersion, 2);
  assert.equal(body.data.values.length, Number(overrides.month ?? query.month));
  return body.data.values;
}

const values = await call();
assert.equal(values[0].ror, 99.76);
assert.equal(values[0].dor, 99.58);
assert.equal(values[35].tos, 111.16);
assert.equal(values[71].ros, 130.15);
assert.equal(values[119].edo, 157.16);
assert.equal(values[143].rod, 181.37);
const withoutTax = await call({ month: "36", skipTax: "true" });
assert.equal(withoutTax[35].tos, 113.79);
for (const skipTax of [false, true]) {
  for (const familyEligible of [false, true]) {
    const comparisonQuery = {
      ...query,
      month: "36",
      contractVersion: "3",
      skipTax: String(skipTax),
      familyEligible: String(familyEligible),
    };
    const response = await fetch(
      `${host}/calculateTreasuryBondsHttpFunction?${new URLSearchParams(comparisonQuery)}`,
      {
        headers: { Origin: "http://localhost:4200" },
        signal: AbortSignal.timeout(30000),
      },
    );
    assert.equal(response.status, 200);
    const { data } = await response.json();
    assert.equal(data.contractVersion, 3);
    assert.equal(data.offerVersion, offer.version);
    assert.equal(data.skipTax, skipTax);
    const types = [
      "ror",
      "dor",
      "tos",
      "coi",
      "edo",
      ...(familyEligible ? ["ros", "rod"] : []),
    ];
    assert.deepEqual(
      data.series.map((series) => series.instrumentId),
      types,
    );
    for (const series of data.series) {
      assert.equal(series.points.length, 36);
      for (const [i, point] of series.points.entries()) {
        assert.equal(point.month, i + 1);
        assert.equal(
          point.value,
          (skipTax ? withoutTax : values)[i][series.instrumentId],
        );
      }
    }
  }
}
for (const overrides of [
  { month: "145" },
  { month: "1.5" },
  { numberOfBonds: "0" },
  { inflation: "[1.01]" },
  { savingsRate: "[-0.1]" },
  { skipTax: "yes" },
]) {
  await call(overrides, 400);
}
console.log(
  `PASS bonds: ${offer.version}, legacy/v3, 4 tax/800+ combinations, maturity examples, skipTax, 6 invalid requests and CORS (${host})`,
);
