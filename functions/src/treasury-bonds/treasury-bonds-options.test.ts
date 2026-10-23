import { deepStrictEqual, strictEqual } from "node:assert";
import { calculate, calculateComparison, execute } from "./treasury-bonds";
import { validate } from "./treasury-bonds.dto";
import { availablePolishBonds } from "../markets/pl/polish-calculator-options";
import { execute as savings } from "../savings/savings";
import { execute as contribution } from "../regular-contributions/regular-contributions";
import type { HttpResponse } from "../http/query-validation";
import type { Request } from "firebase-functions/v2/https";

const base = {
  numberOfBonds: 100,
  month: 144,
  inflation: [0.035],
  referenceRate: [0.04],
  wibor6m: [0],
  savingsRate: [0.02],
  skipTax: false,
};
function call(handler: typeof execute, query: object) {
  let status = 200;
  let body: unknown;
  handler(
    { query } as Request,
    {
      status(value: number) {
        status = value;
        return this;
      },
      send(value: unknown) {
        body = value;
        return this;
      },
    } as HttpResponse,
  );
  return { status, body };
}

describe("Polish calculator IKE and family options", () => {
  for (const ike of [false, true])
    for (const familyEligible of [false, true])
      for (const skipTax of [false, true]) {
        it(`filters the complete timeline without changing maths: ${JSON.stringify({ ike, familyEligible, skipTax })}`, () => {
          const input = { ...base, ike, familyEligible, skipTax };
          const response = calculateComparison(input);
          const expected = calculate({ ...base, skipTax: ike || skipTax });
          strictEqual(response.contractVersion, 3);
          strictEqual(response.calculationVersion, 2);
          strictEqual(response.skipTax, ike || skipTax);
          deepStrictEqual(
            response.series.map((series) => series.instrumentId),
            availablePolishBonds(input),
          );
          strictEqual(response.series.length, familyEligible && !ike ? 7 : 5);
          for (const series of response.series) {
            strictEqual(series.currency, "PLN");
            strictEqual(series.points.length, 144);
            for (const [i, point] of series.points.entries()) {
              strictEqual(point.month, i + 1);
              strictEqual(
                point.value,
                expected.values[i][series.instrumentId as "ror"],
              );
            }
          }
          deepStrictEqual(
            response.benchmark.map((point) => point.value),
            expected.values.map((point) => point.futureValue),
          );
        });
      }

  it("supports legacy HTTP and the new series contract on the same endpoint", () => {
    const query = Object.fromEntries(
      Object.entries(base).map(([key, value]) => [
        key,
        Array.isArray(value) ? JSON.stringify(value) : String(value),
      ]),
    );
    const old = call(execute, query);
    strictEqual(old.status, 200);
    deepStrictEqual(old.body, { data: calculate(base) });
    const current = call(execute, {
      ...query,
      contractVersion: "3",
      ike: "true",
      familyEligible: "true",
    });
    strictEqual(current.status, 200);
    deepStrictEqual(current.body, {
      data: calculateComparison({ ...base, ike: true, familyEligible: true }),
    });
  });

  it("rejects malformed new flags and unsupported contract versions", () => {
    for (const override of [
      { ike: "yes" },
      { familyEligible: "1" },
      { contractVersion: "4" },
      { ike: ["true"] },
    ]) {
      strictEqual(validate({ ...base, ...override }).success, false);
    }
  });

  for (const [name, handler, query] of [
    [
      "savings",
      savings,
      { amount: "10000", duration: "2", inflation: "0.03", rate: "0.05" },
    ],
    [
      "contributions",
      contribution,
      { contribution: "1000", duration: "2", rate: "0.05" },
    ],
  ] as const) {
    it(`${name}: IKE gives exactly the manual tax-free result, even with skipTax=false`, () => {
      const manual = call(handler, { ...query, skipTax: "true" });
      const ike = call(handler, { ...query, skipTax: "false", ike: "true" });
      strictEqual(ike.status, 200);
      deepStrictEqual(ike, manual);
      strictEqual(call(handler, { ...query, ike: "invalid" }).status, 400);
    });
  }
});
