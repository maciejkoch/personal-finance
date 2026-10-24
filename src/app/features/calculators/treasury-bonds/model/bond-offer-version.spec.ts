import { adaptBondComparison } from "./bond-comparison-adapter";
import { TreasuryBondsRequest } from "./treasury-bonds.model";
const request: TreasuryBondsRequest = {
  offerId: "2026-10-" + "a".repeat(24),
  numberOfBonds: 1,
  month: 1,
  inflation: [0],
  savingsRate: [0],
  referenceRate: [0],
  wibor6m: [0],
  skipTax: false,
  familyEligible: false,
};
const payload = () => ({
  contractVersion: 4,
  calculationVersion: 2,
  offerId: request.offerId,
  offerVersion: request.offerId,
  marketId: "pl",
  skipTax: false,
  series: ["ror", "dor", "tos", "coi", "edo"].map((instrumentId) => ({
    instrumentId,
    currency: "PLN",
    points: [{ month: 1, value: 100 }],
  })),
  benchmark: [{ month: 1, value: 100 }],
});
describe("Dynamic offer contract", () => {
  it("accepts the requested revision and rejects a different revision, algorithm or incomplete timeline", () => {
    expect(adaptBondComparison(payload(), request).offerVersion).toBe(
      request.offerId,
    );
    expect(() =>
      adaptBondComparison({ ...payload(), offerId: "other" }, request),
    ).toThrow();
    expect(() =>
      adaptBondComparison({ ...payload(), offerVersion: "other" }, request),
    ).toThrow();
    expect(() =>
      adaptBondComparison({ ...payload(), calculationVersion: 999 }, request),
    ).toThrow();
    expect(() =>
      adaptBondComparison({ ...payload(), benchmark: [] }, request),
    ).toThrow();
  });
});
