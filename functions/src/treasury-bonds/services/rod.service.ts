import { simulateBond } from "../bond-simulation";
import { ROD } from "../treasury-bonds.consts";
import {
  CalculationParams,
  TreasuryBondsResult,
} from "../treasury-bonds.model";

export function calculate(
  count: number,
  months: number,
  params: CalculationParams,
): TreasuryBondsResult {
  return simulateBond(ROD, count, months, params);
}
