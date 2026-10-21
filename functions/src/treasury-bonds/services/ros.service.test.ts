import { strictEqual } from "assert";
import { calculate } from "./ros.service";
import { CalculationParams } from "../treasury-bonds.model";

// Independent examples derived from the October 2026 issue letters; see docs/ETAP-2-RAPORT.md.
const params: CalculationParams = {
  inflation: [0.035],
  referenceRate: [0.04],
  wibor6m: [0],
  savingsRate: [0],
};
describe("ROS October 2026", () => {
  it("is six years long, capitalizes and has no discounted exchange", () => {
    const result = calculate(1, 73, params);
    strictEqual(result[12].buyoutAtEndOfMonth, 102.43); // 105 - 2 - 0.57
    strictEqual(result[72].maturity, true);
    strictEqual(result[72].earlyBuyoutPenalty, 0);
    strictEqual(result[73].buyCost, result[73].numberOfBonds * 100);
    strictEqual(result[73].rate, 0.05);
  });
});
