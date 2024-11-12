import { deepStrictEqual } from 'assert';

import {
  CalculationParams,
  TreasuryBondsMonthlyResult,
} from '../treasury-bonds.model';
import { calculate } from './tos.service';

describe('Calculate treasury bonds', () => {
  it('should work for TOS with 1000 bonds and progressive params', () => {
    const calculationParams: CalculationParams = {
      inflation: [
        0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12,
      ],
      referenceRate: [
        0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12,
      ],
      wibor6m: [
        0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12,
      ],
      savingsRate: [
        0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12,
      ],
    };
    const result = calculate(1000, 144, calculationParams);

    const expectedResult1: Partial<TreasuryBondsMonthlyResult> = {
      numberOfBonds: 1000,
      rate: 0.0595,
      valueAtEndOfMonth: 100495.83,
      earlyBuyoutPenalty: 495.83,
    };
    deepStrictEqual(result[1], { ...result[1], ...expectedResult1 });

    const expectedResult3: Partial<TreasuryBondsMonthlyResult> = {
      rate: 0.0595,
      valueAtEndOfMonth: 101487.5,
      buyoutAtEndOfMonth: 100394.88,
      balanceAtEndOfMonth: 0,
      profitAtEndOfMonth: 0,
      finalValueAtEndOfMath: 100394.88,
    };
    deepStrictEqual(result[3], { ...result[3], ...expectedResult3 });

    const expectedResult7: Partial<TreasuryBondsMonthlyResult> = {
      rate: 0.0595,
      buyoutAtEndOfMonth: 102001.38,
    };
    deepStrictEqual(result[7], { ...result[7], ...expectedResult7 });

    const expectedResult13: Partial<TreasuryBondsMonthlyResult> = {
      rate: 0.0595,
      basisOfCapitalisation: 105950,
      buyoutAtEndOfMonth: 104435.02,
      finalValueAtEndOfMath: 104435.02,
    };
    deepStrictEqual(result[13], { ...result[13], ...expectedResult13 });

    const expectedResult36: Partial<TreasuryBondsMonthlyResult> = {
      numberOfBonds: 1000,
      profitAtEndOfMonth: 51.24,
      earlyBuyoutPenalty: 0,
      nextNumberOfBonds: 1154,
      maturity: true,
      valueAtEndOfMonth: 118933.14,
      nominalValue: 100000,
      rate: 0.0595,
      buyoutAtEndOfMonth: 115335.84,
    };
    deepStrictEqual(result[36], { ...result[36], ...expectedResult36 });

    const expectedResult144: Partial<TreasuryBondsMonthlyResult> = {
      finalValueAtEndOfMath: 177517.36,
    };
    deepStrictEqual(result[144], { ...result[144], ...expectedResult144 });
  });
});
