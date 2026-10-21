import { strictEqual } from "assert";
import { calculate } from "./coi.service";
import { CalculationParams } from "../treasury-bonds.model";

// Independent examples derived from the October 2026 issue letters; see docs/ETAP-2-RAPORT.md.
const params: CalculationParams = {
  inflation: [0.035],
  referenceRate: [0.04],
  wibor6m: [0],
  savingsRate: [0],
};
describe("COI October 2026", () => {
  it("pays the annual coupon once and charges the fee after the first period", () => {
    const result = calculate(1, 48, params);
    strictEqual(result[1].buyoutAtEndOfMonth, 100);
    strictEqual(result[12].profitAtEndOfMonth, 3.84); // 4.75 - ceil(0.9025)
    strictEqual(result[12].buyoutAtEndOfMonth, 98);
    strictEqual(result[12].finalValueAtEndOfMath, 101.84);
    strictEqual(result[13].rate, 0.05); // previous year inflation 3.5% + margin 1.5%
    strictEqual(result[48].earlyBuyoutPenalty, 0);
    strictEqual(result[48].finalValueAtEndOfMath, 115.99);
  });
  it("floors deflation at zero for indexation, without losing a zero scenario value", () => {
    const result = calculate(1, 25, { ...params, inflation: [0, -0.05, 0.5] });
    strictEqual(result[13].rate, 0.015);
    strictEqual(result[25].rate, 0.015);
  });
});
