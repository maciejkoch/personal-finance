import { simulateBond } from "../bond-simulation";
import { DOR } from "../treasury-bonds.consts";
import {
  CalculationParams,
  TreasuryBondsResult,
} from "../treasury-bonds.model";

export function calculate(
  count: number,
  months: number,
  params: CalculationParams,
): TreasuryBondsResult {
  return simulateBond(DOR, count, months, params);
}
