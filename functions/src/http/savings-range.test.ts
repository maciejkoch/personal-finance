import { strictEqual, ok } from "node:assert";
import type { Request } from "firebase-functions/v2/https";
import type { HttpResponse } from "./query-validation";
import { execute as regular } from "../regular-contributions/regular-contributions";
import { execute as savings } from "../savings/savings";

function call(handler: typeof regular, query: object) {
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
  return { status, body: JSON.parse(JSON.stringify(body)) };
}
describe("Portfolio HTTP range and initial capital", () => {
  it("returns a valid initial-capital response including a complete timeline", () => {
    const response = call(regular, {
      contribution: "0",
      initialCapital: "10000",
      duration: "1",
      rate: ".12",
    });
    strictEqual(response.status, 200);
    strictEqual(response.body.data.netValue, 11027.28);
    strictEqual(response.body.data.valueYearPerYear.length, 1);
    const goal = call(savings, {
      amount: "10000",
      initialCapital: "10000",
      duration: "1",
      rate: ".12",
      inflation: "0",
    });
    strictEqual(goal.body.data.monthlyContribution, 0);
    strictEqual(goal.body.data.goalCoveredByInitialCapital, true);
  });
  it("returns controlled HTTP 400 rather than null results or HTTP 500 for unsupported outcomes", () => {
    for (const [handler, query] of [
      [
        regular,
        {
          contribution: "1000000",
          initialCapital: "100000000",
          duration: "100",
          rate: "1",
        },
      ],
      [
        savings,
        { amount: "100000000", duration: "100", rate: ".05", inflation: "1" },
      ],
    ] as const) {
      const response = call(handler, query);
      strictEqual(response.status, 400);
      strictEqual(response.body.name, "CalculationRangeError");
      ok(response.body.message.includes("zakres"));
      strictEqual(response.body.data, undefined);
    }
  });
});
