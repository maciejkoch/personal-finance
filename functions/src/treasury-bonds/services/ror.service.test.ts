import { strictEqual } from "assert";
import { calculate } from "./ror.service";
import { CalculationParams } from "../treasury-bonds.model";

// Independent examples derived from the October 2026 issue letters; see docs/ETAP-2-RAPORT.md.
const params: CalculationParams = {
  inflation: [0.035],
  referenceRate: [0.04],
  wibor6m: [0],
  savingsRate: [0],
};
describe("ROR October 2026", () => {
  it("pays the 0.33 PLN first coupon, then charges 0.50 PLN after that coupon", () => {
    const result = calculate(1, 12, params);
    strictEqual(result[1].rate, 0.04);
    strictEqual(result[1].profitAtEndOfMonth, 0.26); // 0.33 - ceil(0.0627) = 0.26
    strictEqual(result[1].buyoutAtEndOfMonth, 99.5);
    strictEqual(result[1].finalValueAtEndOfMath, 99.76);
    strictEqual(result[12].earlyBuyoutPenalty, 0);
    strictEqual(result[12].finalValueAtEndOfMath, 103.12);
  });
  it("uses the reference-rate scenario from month two without a tax refund on a loss", () => {
    const result = calculate(1, 2, { ...params, referenceRate: [0.06] });
    strictEqual(result[2].rate, 0.06);
    strictEqual(result[2].buyoutAtEndOfMonth, 99.5);
    strictEqual(result[2].finalValueAtEndOfMath, 100.16);
  });
});
