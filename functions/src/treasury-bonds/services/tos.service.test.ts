import { deepStrictEqual, strictEqual } from "assert";
import { calculate } from "./tos.service";
import { CalculationParams } from "../treasury-bonds.model";

// Independent examples derived from the October 2026 issue letters; see docs/ETAP-2-RAPORT.md.
const params: CalculationParams = {
  inflation: [0.035],
  referenceRate: [0.04],
  wibor6m: [0],
  savingsRate: [0],
};
describe("TOS October 2026", () => {
  it("matches the explicit 113.79 PLN gross redemption in letter 97/2026 section 14", () => {
    const result = calculate(1, 36, params);
    strictEqual(result[36].valueAtEndOfMonth, 113.79);
    strictEqual(result[36].buyoutAtEndOfMonth, 111.16); // tax ceil(13.79 * 19%) = 2.63
    strictEqual(result[36].earlyBuyoutPenalty, 0);
    strictEqual(result[35].earlyBuyoutPenalty, 1);
    strictEqual(result[1].buyoutAtEndOfMonth, 100);
  });
  it("never indexes TOS to WIBOR, NBP or inflation", () => {
    deepStrictEqual(
      calculate(100, 36, params),
      calculate(100, 36, {
        ...params,
        wibor6m: [1],
        referenceRate: [1],
        inflation: [1],
      }),
    );
  });
  it("uses ACT/ACT and rounded N1 for an early redemption in a leap-year period", () => {
    // Annex 2: 104.40 * (1 + 0.044 * 31/366) - 1 = 103.79 gross.
    strictEqual(calculate(1, 13, params)[13].buyoutAtEndOfMonth, 103.06);
  });
});
