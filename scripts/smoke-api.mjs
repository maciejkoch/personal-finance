import assert from "node:assert/strict";

const project =
  process.env.OSZCZEDZIFY_EMULATOR_PROJECT ?? "personal-finance-2ee61";
const local = `http://127.0.0.1:5001/${project}/us-central1`;
const production =
  "https://us-central1-personal-finance-2ee61.cloudfunctions.net";
const compare = process.argv.includes("--compare-production");
const productionOnly = process.argv.includes("--production");
const contracts = process.argv.includes("--contracts");
if (compare && productionOnly) {
  throw new Error("Choose either --production or --compare-production.");
}
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

async function checkContracts(host, name) {
  const invalid = await fetch(`${host}/${name}`, {
    headers: { Origin: "http://localhost:4200" },
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(invalid.status, 400, `${name}: invalid input must return 400`);
  assert.equal(
    invalid.headers.get("access-control-allow-origin"),
    "http://localhost:4200",
  );
  const error = await invalid.json();
  assert.equal(error.name, "ZodError", `${name}: stable error name`);
  assert.ok(
    Array.isArray(error.issues) && error.issues.length > 0,
    `${name}: validation issues`,
  );
  const preflight = await fetch(`${host}/${name}`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:4200",
      "Access-Control-Request-Method": "GET",
    },
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(
    preflight.status,
    204,
    `${name}: CORS preflight must return 204`,
  );
  assert.equal(
    preflight.headers.get("access-control-allow-origin"),
    "http://localhost:4200",
  );

  if (host !== local) return;
  const params = cases.find(([endpoint]) => endpoint === name)[1];
  const malformed = {
    calculateSavingsHttpFunction: [
      { duration: "1.5" },
      { duration: "101" },
      { inflation: "" },
      { rate: "1.01" },
      { skipTax: "yes" },
    ],
    calculateRegularContributionHttpFunction: [
      { duration: "1.5" },
      { duration: "101" },
      { contribution: "0" },
      { rate: "" },
      { skipTax: "yes" },
    ],
    calculateTreasuryBondsHttpFunction: [
      { month: "1.5" },
      { month: "145" },
      { inflation: "not-json" },
      { skipTax: "yes" },
    ],
    articleHttpFunction: [{ slug: "../README" }, { slug: "" }],
  }[name];
  const queries = malformed.map(
    (overrides) => new URLSearchParams({ ...params, ...overrides }),
  );
  const duplicate = new URLSearchParams(params);
  const firstKey = Object.keys(params)[0];
  duplicate.append(firstKey, params[firstKey]);
  queries.push(duplicate);
  for (const query of queries) {
    const response = await fetch(`${host}/${name}?${query}`, {
      signal: AbortSignal.timeout(30000),
    });
    assert.equal(
      response.status,
      400,
      `${name}: reject malformed or repeated input: ${query}`,
    );
    const body = await response.json();
    assert.equal(body.name, "ZodError");
    assert.ok(body.issues.length > 0);
  }
  const deniedOrigin = await fetch(
    `${host}/${name}?${new URLSearchParams(params)}`,
    {
      headers: { Origin: "https://untrusted.example" },
      signal: AbortSignal.timeout(30000),
    },
  );
  assert.equal(deniedOrigin.headers.get("access-control-allow-origin"), null);
  await deniedOrigin.arrayBuffer();
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
    if (contracts) await checkContracts(base, name);
    console.log(
      `PASS ${name}${compare ? " (local = production)" : ""}${contracts ? " + validation/CORS" : ""}`,
    );
  } catch (error) {
    console.error(`FAIL ${name}: ${error.message}`);
    failed = true;
  }
}
process.exitCode = failed ? 1 : 0;
