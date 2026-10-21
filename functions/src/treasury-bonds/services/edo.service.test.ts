import { strictEqual } from "assert";
import { calculate } from "./edo.service";
import { CalculationParams } from "../treasury-bonds.model";

// Independent examples derived from the October 2026 issue letters; see docs/ETAP-2-RAPORT.md.
const params: CalculationParams = {
  inflation: [0.035],
  referenceRate: [0.04],
  wibor6m: [0],
  savingsRate: [0],
};
describe("EDO October 2026", () => {
  it("compounds without annual tax and subtracts the fee before taxing redemption", () => {
    const result = calculate(1, 24, params);
    strictEqual(result[12].profitAtEndOfMonth, 0);
    strictEqual(result[12].buyoutAtEndOfMonth, 101.9); // (105.35 - 3) - 0.45
    strictEqual(result[13].rate, 0.055);
    strictEqual(result[24].valueAtEndOfMonth, 111.14); // 100 * 1.0535 * 1.055
    strictEqual(result[24].buyoutAtEndOfMonth, 106.59); // 108.14 - ceil(8.14 * 19%)
  });
  it("does not charge the fee at ten-year maturity", () => {
    strictEqual(calculate(1, 120, params)[120].earlyBuyoutPenalty, 0);
  });
});
