import { strictEqual } from "assert";
import { calculate } from "./rod.service";
import { CalculationParams } from "../treasury-bonds.model";

// Independent examples derived from the October 2026 issue letters; see docs/ETAP-2-RAPORT.md.
const params: CalculationParams = {
  inflation: [0.035],
  referenceRate: [0.04],
  wibor6m: [0],
  savingsRate: [0],
};
describe("ROD October 2026", () => {
  it("is twelve years long and caps the fee at accrued interest", () => {
    const result = calculate(1, 144, params);
    strictEqual(result[1].buyoutAtEndOfMonth, 100);
    strictEqual(result[12].buyoutAtEndOfMonth, 102.1); // 105.60 - 3 - ceil(2.60 * 19%)
    strictEqual(result[72].maturity, false);
    strictEqual(result[143].earlyBuyoutPenalty, 3);
    strictEqual(result[144].maturity, true);
    strictEqual(result[144].earlyBuyoutPenalty, 0);
  });
});
