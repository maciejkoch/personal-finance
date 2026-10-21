import { strictEqual } from "assert";
import { calculate } from "./dor.service";
import { CalculationParams } from "../treasury-bonds.model";

// Independent examples derived from the October 2026 issue letters; see docs/ETAP-2-RAPORT.md.
const params: CalculationParams = {
  inflation: [0.035],
  referenceRate: [0.04],
  wibor6m: [0],
  savingsRate: [0],
};
describe("DOR October 2026", () => {
  it("rounds a 0.345833 coupon per bond and applies the 0.70 PLN fee separately", () => {
    const result = calculate(1, 24, params);
    strictEqual(result[1].rate, 0.0415);
    strictEqual(result[1].profitAtEndOfMonth, 0.28);
    strictEqual(result[1].buyoutAtEndOfMonth, 99.3);
    strictEqual(result[1].finalValueAtEndOfMath, 99.58);
    strictEqual(result[2].rate, 0.0415);
    strictEqual(result[24].earlyBuyoutPenalty, 0);
    strictEqual(result[24].finalValueAtEndOfMath, 106.72);
  });
});
