import assert from "node:assert/strict";

const project = "personal-finance-2ee61";
const local = `http://127.0.0.1:5001/${project}/us-central1`;
const production = `https://us-central1-${project}.cloudfunctions.net`;
const compare = process.argv.includes("--compare-production");
const productionOnly = process.argv.includes("--production");
const base = productionOnly ? production : local;
const cases = [
  [
    "calculateSavingsHttpFunction",
    {
      amount: "10000",
      duration: "12",
      inflation: "0.03",
      rate: "0.05",
      skipTax: "false",
    },
  ],
  [
    "calculateRegularContributionHttpFunction",
    { contribution: "500", duration: "12", rate: "0.05", skipTax: "false" },
  ],
  [
    "calculateTreasuryBondsHttpFunction",
    {
      numberOfBonds: "100",
      month: "24",
      inflation: "[0.035]",
      wibor6m: "[0.0584]",
      referenceRate: "[0.0575]",
      savingsRate: "[0.1]",
    },
  ],
  ["articleHttpFunction", { slug: "kalkulator-obligacji-skarbowych" }],
];

async function call(host, name, params) {
  const response = await fetch(
    `${host}/${name}?${new URLSearchParams(params)}`,
    {
      headers: { Origin: "http://localhost:4200" },
      signal: AbortSignal.timeout(30000),
    },
  );
  assert.equal(response.status, 200, `${name}: HTTP ${response.status}`);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "http://localhost:4200",
    `${name}: CORS`,
  );
  if (host === local) {
    const build = response.headers.get("x-oszczedzify-build");
    assert.ok(build && build !== "unknown", `${name}: missing build metadata`);
  }
  const body = await response.json();
  if (name === "articleHttpFunction") assert.match(body.html, /<h[1-6][ >]/);
  else
    assert.ok(
      body.data && typeof body.data === "object",
      `${name}: missing calculation data`,
    );
  return body;
}

let failed = false;
for (const [name, params] of cases) {
  try {
    const body = await call(base, name, params);
    if (compare && !productionOnly) {
      assert.deepEqual(
        body,
        await call(production, name, params),
        `${name}: local/production responses differ`,
      );
    }
    console.log(`PASS ${name}${compare ? " (local = production)" : ""}`);
  } catch (error) {
    console.error(`FAIL ${name}: ${error.message}`);
    failed = true;
  }
}
process.exitCode = failed ? 1 : 0;
