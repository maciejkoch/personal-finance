import { adaptBondComparison } from "./bond-comparison-adapter";
import { BondComparisonResponse } from "@contracts/bond-comparison";
import { TreasuryBondsRequest } from "./treasury-bonds.model";
import * as offer from "@data/bond-offer";

const request: TreasuryBondsRequest = {
  numberOfBonds: 1,
  month: 12,
  inflation: [0],
  referenceRate: [0],
  savingsRate: [0],
  wibor6m: [0],
  skipTax: false,
  familyEligible: false,
};
function response(): BondComparisonResponse {
  return {
    contractVersion: 3,
    calculationVersion: 2,
    offerVersion: offer.version,
    marketId: "pl",
    skipTax: false,
    series: ["ror", "dor", "tos", "coi", "edo"].map((instrumentId, n) => ({
      instrumentId,
      currency: "PLN",
      points: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        value: 100 + n + i,
      })),
    })),
    benchmark: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      value: 100,
    })),
  };
}

describe("Bond comparison contract", () => {
  it("adapts validated series without inventing values for unavailable products", () => {
    const result = adaptBondComparison(response(), request);
    expect(result.activeBondTypes).toEqual(["ror", "dor", "tos", "coi", "edo"]);
    expect(result.values[11]).toEqual({
      month: 12,
      futureValue: 100,
      ror: 111,
      dor: 112,
      tos: 113,
      coi: 114,
      edo: 115,
    });
    expect(
      result.values.every((point) => !("ros" in point) && !("rod" in point)),
    ).toBe(true);
  });

  for (const [name, corrupt] of [
    ["missing series", (value: BondComparisonResponse) => value.series.pop()],
    [
      "duplicate type",
      (value: BondComparisonResponse) => {
        value.series[1].instrumentId = "ror";
      },
    ],
    [
      "ineligible family type",
      (value: BondComparisonResponse) => {
        value.series[4].instrumentId = "rod";
      },
    ],
    [
      "missing month",
      (value: BondComparisonResponse) => value.series[0].points.pop(),
    ],
    [
      "unordered months",
      (value: BondComparisonResponse) => {
        value.series[0].points[0].month = 2;
      },
    ],
    [
      "invalid amount",
      (value: BondComparisonResponse) => {
        value.series[0].points[0].value = NaN;
      },
    ],
    [
      "wrong currency",
      (value: BondComparisonResponse) => {
        value.series[0].currency = "USD";
      },
    ],
    [
      "stale offer",
      (value: BondComparisonResponse) => {
        value.offerVersion = "old";
      },
    ],
    [
      "wrong tax setting",
      (value: BondComparisonResponse) => {
        value.skipTax = true;
      },
    ],
    [
      "incomplete benchmark",
      (value: BondComparisonResponse) => value.benchmark.pop(),
    ],
  ] as const) {
    it(`rejects ${name} instead of showing a plausible result`, () => {
      const payload = response();
      corrupt(payload);
      expect(() => adaptBondComparison(payload, request)).toThrow();
    });
  }
});
