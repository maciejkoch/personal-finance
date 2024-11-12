import { mapValues } from 'lodash';
import { getNOrLastValue } from '../calculations/calculations.service';
import {
  CalculationParams,
  CalculationParamsByMonthFn,
  TreasuryBondsResult,
  TreasuryBondsSimpleResult,
} from './treasury-bonds.model';

export function simplifyResult(
  result: TreasuryBondsResult
): TreasuryBondsSimpleResult {
  return mapValues(result, (value) => value.finalValueAtEndOfMath);
}

export function createCalculationParamsByMonthFn(
  params: CalculationParams
): CalculationParamsByMonthFn {
  return (month) => {
    const year = Math.ceil(month / 12);
    return {
      inflation: getNOrLastValue(params.inflation, year),
      referenceRate: getNOrLastValue(params.referenceRate, year),
      savingsRate: getNOrLastValue(params.savingsRate, year),
      wibor6m: getNOrLastValue(params.wibor6m, year),
    };
  };
}
