import { deepStrictEqual, strictEqual } from "node:assert";
import type { Request } from "firebase-functions/v2/https";
import type { HttpResponse } from "./query-validation";
import { execute as bonds } from "../treasury-bonds/treasury-bonds";
import { execute as savings } from "../savings/savings";
import { execute as contribution } from "../regular-contributions/regular-contributions";
import reference from "../calculations/regression-reference.json";

function call(handler: typeof bonds, query: Record<string, string>) {
  let status = 200;
  let body: unknown;
  const response = {
    status(value: number) {
      status = value;
      return this;
    },
    send(value: unknown) {
      body = value;
      return this;
    },
  } as HttpResponse;
  handler({ query } as Request, response);
  // Exercise the actual JSON wire representation, not class instances.
  return { status, body: JSON.parse(JSON.stringify(body)) };
}

describe("Calculator HTTP numerical regressions", () => {
  for (const [endpoint, cases] of [
    ["regular contributions", reference.regularContributions],
    ["savings goal", reference.savings],
  ] as const) {
    for (const testCase of cases) {
      it(`${endpoint}: ${testCase.name}`, () => {
        const query = Object.fromEntries(
          Object.entries(testCase.input).map(([key, value]) => [
            key,
            String(value),
          ]),
        );
        const response = call(
          endpoint === "savings goal" ? savings : contribution,
          query,
        );
        strictEqual(response.status, 200);
        deepStrictEqual(Object.keys(response.body), ["data"]);
        for (const [field, expected] of Object.entries(testCase.expected)) {
          strictEqual(
            response.body.data[field],
            expected,
            `${endpoint}: ${field}`,
          );
        }
      });
    }
  }

  const query = {
    numberOfBonds: "100",
    month: "36",
    inflation: "[0,-0.02]",
    referenceRate: "[0.04]",
    savingsRate: "[0]",
  };

  it("preserves zero and negative inflation, falls back to the last scenario and returns complete months", () => {
    const response = call(bonds, query);
    strictEqual(response.status, 200);
    strictEqual(response.body.data.offerVersion, reference.offerVersion);
    strictEqual(response.body.data.calculationVersion, 2);
    const values = response.body.data.values as Record<string, number>[];
    deepStrictEqual(
      values.map((value) => value["month"]),
      Array.from({ length: 36 }, (_, i) => i + 1),
    );
    for (const value of values) {
      deepStrictEqual(
        Object.keys(value).sort(),
        [
          "month",
          "futureValue",
          "ror",
          "dor",
          "tos",
          "coi",
          "edo",
          "ros",
          "rod",
        ].sort(),
      );
      for (const amount of Object.values(value))
        strictEqual(Number.isFinite(amount), true);
    }
    // 10000 × .98 in year two; the missing year three repeats −2%.
    for (const [month, amount] of [
      [1, 10000],
      [12, 10000],
      [13, 9983.33],
      [24, 9800],
      [25, 9783.67],
      [36, 9604],
    ]) {
      strictEqual(values[month - 1]["futureValue"], amount, `month ${month}`);
    }
  });

  it("default and explicit false taxation are identical for old clients", () => {
    deepStrictEqual(
      call(bonds, query),
      call(bonds, { ...query, skipTax: "false", wibor6m: "[0]" }),
    );
  });

  it("returns an error for ambiguous boolean input without returning partial calculations", () => {
    const response = call(bonds, { ...query, skipTax: "TRUE" });
    strictEqual(response.status, 400);
    strictEqual(response.body.data, undefined);
    strictEqual(response.body.name, "ZodError");
    strictEqual(
      response.body.issues.some((issue: { path: string[] }) =>
        issue.path.includes("skipTax"),
      ),
      true,
    );
  });
});
