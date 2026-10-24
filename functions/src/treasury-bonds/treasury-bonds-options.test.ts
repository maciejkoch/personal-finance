import { deepStrictEqual, strictEqual } from "node:assert";
import { calculate, calculateComparison, execute } from "./treasury-bonds";
import { validate } from "./treasury-bonds.dto";
import { availablePolishBonds } from "../markets/pl/polish-calculator-options";
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

describe("Polish tax and family options", () => {
  for (const familyEligible of [false, true])
    for (const skipTax of [false, true]) {
      it(`filters the complete timeline without changing maths: ${JSON.stringify({ familyEligible, skipTax })}`, () => {
        const input = { ...base, familyEligible, skipTax };
        const response = calculateComparison(input);
        const expected = calculate({ ...base, skipTax: skipTax });
        strictEqual(response.contractVersion, 3);
        strictEqual(response.calculationVersion, 2);
        strictEqual(response.skipTax, skipTax);
        deepStrictEqual(
          response.series.map((series) => series.instrumentId),
          availablePolishBonds(input),
        );
        strictEqual(response.series.length, familyEligible ? 7 : 5);
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
      familyEligible: "true",
    });
    strictEqual(current.status, 200);
    deepStrictEqual(current.body, {
      data: calculateComparison({ ...base, familyEligible: true }),
    });
  });

  it("rejects malformed new flags and unsupported contract versions", () => {
    for (const override of [
      { familyEligible: "1" },
      { contractVersion: "4" },
      { familyEligible: ["true"] },
    ]) {
      strictEqual(validate({ ...base, ...override }).success, false);
    }
  });
});
