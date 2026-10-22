import { deepStrictEqual, strictEqual, ok } from "assert";
import { simulateBond, paymentTax } from "./bond-simulation";
import { TREASURY_BONDS_OFFER, ROR, TOS, COI } from "./treasury-bonds.consts";
import { TreasuryBondsSchemaDTO, validate } from "./treasury-bonds.dto";
import { calculate, execute } from "./treasury-bonds";
import { CalculationParams } from "./treasury-bonds.model";
import { Request } from "firebase-functions/v2/https";
import type { HttpResponse as Response } from "../http/query-validation";

const params: CalculationParams = {
  inflation: [0.035],
  referenceRate: [0.04],
  wibor6m: [0],
  savingsRate: [0],
};
function dto(query: unknown): TreasuryBondsSchemaDTO {
  const parsed = validate(query);
  if (!parsed.success) throw parsed.error;
  return parsed.data;
}
const query = {
  numberOfBonds: "100",
  month: "144",
  inflation: "[0.035]",
  referenceRate: "[0.04]",
  savingsRate: "[0]",
  wibor6m: "[0]",
};

describe("Bond HTTP contract and bounds", () => {
  it("accepts old queries, adds defaults and preserves the values array contract", () => {
    const parsed = validate(query);
    if (!parsed.success) throw parsed.error;
    strictEqual(parsed.data.skipTax, false);
    const result = calculate(parsed.data);
    strictEqual(result.offerVersion, "2026-10-v1");
    strictEqual(result.calculationVersion, 2);
    strictEqual(result.values.length, 144);
    deepStrictEqual(
      Object.keys(result.values[0]).sort(),
      [
        "month",
        "ror",
        "dor",
        "tos",
        "coi",
        "edo",
        "ros",
        "rod",
        "futureValue",
      ].sort(),
    );
  });
  it("accepts month 1 and optional obsolete WIBOR, strictly parses skipTax", () => {
    strictEqual(
      validate({ ...query, month: "1", wibor6m: undefined, skipTax: "true" })
        .success,
      true,
    );
    for (const skipTax of ["yes", "1", [], null])
      strictEqual(validate({ ...query, skipTax }).success, false);
  });
  it("rejects fractional counts/months, oversized work and malformed scenario arrays", () => {
    for (const [key, values] of Object.entries({
      month: ["0", "145", "1.5", "", "Infinity", ["12"]],
      numberOfBonds: ["0", "1.5", "1000001", "NaN"],
      referenceRate: [
        "[-0.01]",
        "[1.01]",
        "[]",
        "[null]",
        "not json",
        JSON.stringify(Array(13).fill(0)),
      ],
      inflation: ["[-1]", "[1.01]"],
      savingsRate: ["[-0.1]", "[100]"],
    })) {
      for (const value of values)
        strictEqual(
          validate({ ...query, [key]: value }).success,
          false,
          `${key}=${value}`,
        );
    }
    strictEqual(validate({ ...query, inflation: "[-0.99,0,1]" }).success, true);
  });
  it("returns HTTP 400 for invalid query data and 200 for a supported old client", () => {
    const calls: { status?: number; body?: unknown } = {};
    const response = {
      status(value: number) {
        calls.status = value;
        return this;
      },
      send(value: unknown) {
        calls.body = value;
        return this;
      },
    } as Response;
    execute(
      { query: { ...query, month: "145" } } as unknown as Request,
      response,
    );
    strictEqual(calls.status, 400);
    execute({ query } as unknown as Request, response);
    strictEqual(calls.status, 200);
    ok(calls.body);
  });
});

describe("Tax, reinvestment and conservation", () => {
  it("matches independent full-term product examples for all capitalizing types", () => {
    // Letter annex products, computed separately with decimal arithmetic:
    // EDO: 100 * 1.0535 * 1.055^9; ROS: 100 * 1.05 * 1.055^5; ROD: 100 * 1.056 * 1.06^11.
    for (const [type, month, gross, net] of [
      ["EDO", 120, 170.57, 157.16],
      ["ROS", 72, 137.23, 130.15],
      ["ROD", 144, 200.46, 181.37],
    ] as const) {
      const point = simulateBond(
        TREASURY_BONDS_OFFER.bonds[type],
        1,
        month,
        params,
      )[month];
      strictEqual(point.valueAtEndOfMonth, gross);
      strictEqual(point.buyoutAtEndOfMonth, net);
    }
  });
  it("rounds tax up and never returns negative tax", () => {
    strictEqual(paymentTax(0.01), 0.01);
    strictEqual(paymentTax(1), 0.19);
    strictEqual(paymentTax(13.79), 2.63);
    strictEqual(paymentTax(-1), 0);
    strictEqual(paymentTax(10, true), 0);
  });
  it("rounds the bond amount before scaling, but taxes the total payment", () => {
    const result = simulateBond(TOS, 100, 36, params)[36];
    strictEqual(result.valueAtEndOfMonth, 11379); // 113.79 per bond, per letter 97/2026
    strictEqual(result.buyoutAtEndOfMonth, 11116.99); // 1379 * .19 = 262.01
    strictEqual(
      simulateBond(TOS, 100, 36, { ...params, skipTax: true })[36]
        .buyoutAtEndOfMonth,
      11379,
    );
  });
  it("passes skipTax through HTTP calculation to coupons and savings", () => {
    const withTax = calculate(dto({ ...query, month: "24" }));
    const withoutTax = calculate(
      dto({ ...query, month: "24", skipTax: "true" }),
    );
    ok(withoutTax.values[23].ror > withTax.values[23].ror);
    strictEqual(
      simulateBond(ROR, 100, 2, { ...params, savingsRate: [0.12] })[2]
        .balanceAtEndOfMonth,
      53.67,
    );
  });
  it("keeps redemption cash exactly once and does not re-buy at the terminal point", () => {
    const result = simulateBond(TOS, 100, 37, params);
    const atMaturity = result[36];
    const next = result[37];
    strictEqual(atMaturity.finalValueAtEndOfMath, 11116.99);
    strictEqual(next.numberOfBonds, 111);
    strictEqual(next.buyCost, 11088.9); // 111 * 99.90
    strictEqual(next.balanceAtEndOfMonth, 28.09);
    strictEqual(simulateBond(TOS, 100, 36, params)[36].nextNumberOfBonds, 100);
  });
  it("cannot create value through fees or count fallback and keeps snapshots independent of horizon", () => {
    for (const bond of Object.values(TREASURY_BONDS_OFFER.bonds)) {
      const full = simulateBond(bond, 1, 144, params);
      for (const month of [
        1, 11, 12, 13, 23, 24, 35, 36, 47, 48, 71, 72, 73, 119, 120, 121, 143,
        144,
      ]) {
        strictEqual(
          full[month].finalValueAtEndOfMath,
          simulateBond(bond, 1, month, params)[month].finalValueAtEndOfMath,
        );
        ok(Number.isFinite(full[month].finalValueAtEndOfMath));
      }
    }
    const noRate = { ...ROR, firstPeriodRate: 0, margin: 0, exchangeCost: 100 };
    for (const value of Object.values(
      simulateBond(noRate, 1, 144, { ...params, referenceRate: [0] }),
    )) {
      ok(value.finalValueAtEndOfMath <= 100);
    }
  });
  it("retains a locked annual rate and uses the preceding inflation scenario", () => {
    const result = simulateBond(COI, 1, 36, {
      ...params,
      inflation: [0, 0.1, 0.2],
    });
    strictEqual(result[12].rate, 0.0475);
    strictEqual(result[13].rate, 0.015);
    strictEqual(result[24].rate, 0.015);
    strictEqual(result[25].rate, 0.115);
  });
  it("preserves a zero inflation year in the purchasing-power benchmark", () => {
    const result = calculate(
      dto({ ...query, month: "24", inflation: "[0,0.1]" }),
    );
    strictEqual(result.values[11].futureValue, 10000);
    strictEqual(result.values[23].futureValue, 11000);
  });
  it("allows the last maturity coupon to participate in exchange, preserving leftover cash", () => {
    const result = simulateBond(ROR, 300, 13, params);
    // Principal 30000 + final net coupon 80.19 = 30080.19. Past coupons = 882.09.
    strictEqual(result[12].nextNumberOfBonds, 309); // 301 exchange + 8 nominal-price bonds
    strictEqual(result[12].nextBuyCost, 30869.9);
    strictEqual(result[13].balanceAtEndOfMonth, 174.97); // remaining 92.38 + new net coupon 82.59
  });
});
