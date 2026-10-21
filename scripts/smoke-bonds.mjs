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
  : "http://127.0.0.1:5001/personal-finance-2ee61/us-central1";
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
  `PASS bonds: ${offer.version}, maturity examples, skipTax, 6 invalid requests and CORS (${host})`,
);
