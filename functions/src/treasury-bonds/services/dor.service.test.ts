import { deepStrictEqual } from 'assert';

import {
  CalculationParams,
  TreasuryBondsMonthlyResult,
} from '../treasury-bonds.model';
import { calculate } from './dor.service';

describe('Calculate treasury bonds', () => {
  it('should work for DOR with 100 bonds', () => {
    const calculationParams: CalculationParams = {
      inflation: [0.049],
      referenceRate: [0.0575],
      wibor6m: [0.0584],
      savingsRate: [0.06],
    };
    const result = calculate(100, 144, calculationParams);

    const expectedResult1: TreasuryBondsMonthlyResult = {
      rate: 0.059,
      numberOfBonds: 100,
      nextNumberOfBonds: 100,
      buyCost: 10000,
      nextBuyCost: 10000,
      nominalValue: 10000,
      nextNominalValue: 10000,
      basisOfCapitalisation: 10000,
      nextBasisOfCapitalisation: 10000,
      maturity: false,
      valueAtEndOfMonth: 10049.17,
      earlyBuyoutPenalty: 49.17,
      buyoutAtEndOfMonth: 10000,

      profitAtEndOfMonth: 39.82,
      balanceAtEndOfMonth: 39.82,
      finalValueAtEndOfMath: 10000,
    };
    deepStrictEqual(result[1], expectedResult1);

    const expectedResult144: TreasuryBondsMonthlyResult = {
      rate: 0.059,
      numberOfBonds: 161,
      nextNumberOfBonds: 177,
      buyCost: 16085.3,
      nextBuyCost: 17683.9,
      nominalValue: 16100,
      nextNominalValue: 17700,
      basisOfCapitalisation: 16100,
      nextBasisOfCapitalisation: 17700,
      maturity: true,
      valueAtEndOfMonth: 16179.16,
      earlyBuyoutPenalty: 0,
      buyoutAtEndOfMonth: 16164.12,

      profitAtEndOfMonth: 0,
      balanceAtEndOfMonth: 1648.58,
      finalValueAtEndOfMath: 17812.7,
    };
    deepStrictEqual(result[144], expectedResult144);
  });

  it('should work for DOR with 1000 bonds and progressive params', () => {
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
    const expectedResult144: Partial<TreasuryBondsMonthlyResult> = {
      finalValueAtEndOfMath: 194938.41,
    };
    deepStrictEqual(result[144], { ...result[144], ...expectedResult144 });
  });
});
