import assert from "node:assert/strict";
const production = process.argv.includes("--production");
const expected = process.argv
  .find((arg) => arg.startsWith("--expect-sha="))
  ?.split("=")[1];
const host = production
  ? "https://us-central1-personal-finance-2ee61.cloudfunctions.net"
  : `http://127.0.0.1:5001/${process.env.OSZCZEDZIFY_EMULATOR_PROJECT ?? "personal-finance-2ee61"}/us-central1`;
async function call(endpoint, query, status = 200) {
  const response = await fetch(
    `${host}/${endpoint}?${new URLSearchParams(query)}`,
    {
      headers: { Origin: "https://oszczedzify.org" },
      signal: AbortSignal.timeout(30000),
    },
  );
  assert.equal(response.status, status);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "https://oszczedzify.org",
  );
  if (expected)
    assert.ok(
      response.headers.get("x-oszczedzify-build")?.includes(expected),
      "Incorrect deployed Functions build",
    );
  const body = await response.json();
  return status === 200 ? body.data : body;
}
const regular = "calculateRegularContributionHttpFunction";
const goal = "calculateSavingsHttpFunction";
const base = {
  contribution: "0",
  initialCapital: "10000",
  duration: "1",
  rate: ".12",
  skipTax: "false",
};
const capital = await call(regular, base);
assert.equal(capital.netValue, 11027.28);
assert.equal(capital.tax, 240.97);
assert.equal(capital.totalContribution, 0);
assert.equal(capital.totalDeposited, 10000);
assert.equal(capital.valueYearPerYear.length, 1);
assert.equal(
  (await call(regular, { ...base, skipTax: "true" })).netValue,
  11268.25,
);
assert.equal(
  (
    await call(regular, {
      ...base,
      initialCapital: "0",
      contribution: "1000",
      rate: "1e-16",
    })
  ).netValue,
  12000,
);
const covered = await call(goal, {
  amount: "10000",
  initialCapital: "10000",
  duration: "1",
  inflation: "0",
  rate: ".12",
});
assert.equal(covered.goalCoveredByInitialCapital, true);
assert.equal(covered.monthlyContribution, 0);
assert.equal(covered.netValue, 11027.28);
assert.equal(
  (await call(regular, { ...base, initialCapital: "1e308" }, 400)).name,
  "ZodError",
);
assert.equal(
  (
    await call(
      regular,
      {
        ...base,
        initialCapital: "100000000",
        contribution: "1000000",
        duration: "100",
        rate: "1",
      },
      400,
    )
  ).name,
  "CalculationRangeError",
);
assert.equal(
  (
    await call(
      goal,
      { amount: "100000000", duration: "1", inflation: "0", rate: "0" },
      400,
    )
  ).name,
  "CalculationRangeError",
);
console.log(
  `PASS savings: initial capital, zero payments, covered goal, near-zero rate, tax option, input/outcome limits and CORS (${host})`,
);
