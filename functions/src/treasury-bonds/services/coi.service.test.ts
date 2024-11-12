import { deepStrictEqual } from 'assert';

import {
  CalculationParams,
  TreasuryBondsMonthlyResult,
} from '../treasury-bonds.model';
import { calculate } from './coi.service';

describe('Calculate treasury bonds', () => {
  it('should work for COI with 1000 bonds and progressive params', () => {
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
      rate: 0.063,
      valueAtEndOfMonth: 100525,
    };
    deepStrictEqual(result[1], { ...result[1], ...expectedResult1 });

    const expectedResult12: Partial<TreasuryBondsMonthlyResult> = {
      rate: 0.063,
      valueAtEndOfMonth: 106300,
      nominalValue: 100000,
      profitAtEndOfMonth: 5103,
      finalValueAtEndOfMath: 103483,
    };
    deepStrictEqual(result[12], { ...result[12], ...expectedResult12 });

    const expectedResult13: Partial<TreasuryBondsMonthlyResult> = {
      rate: 0.025,
      valueAtEndOfMonth: 100208.33,
      finalValueAtEndOfMath: 103658.64,
      buyoutAtEndOfMonth: 98548.75,
    };
    deepStrictEqual(result[13], { ...result[13], ...expectedResult13 });

    const expectedResult48: Partial<TreasuryBondsMonthlyResult> = {
      rate: 0.045,
      maturity: true,
      finalValueAtEndOfMath: 114204.69,
      earlyBuyoutPenalty: 0,
      balanceAtEndOfMonth: 10608.39,
      buyoutAtEndOfMonth: 103645,
      profitAtEndOfMonth: 48.7,
      nextNumberOfBonds: 1143,
    };
    deepStrictEqual(result[48], { ...result[48], ...expectedResult48 });

    const expectedResult49: Partial<TreasuryBondsMonthlyResult> = {
      finalValueAtEndOfMath: 114308.42,
      earlyBuyoutPenalty: 600.07,
      rate: 0.063,
      numberOfBonds: 1143,
      buyoutAtEndOfMonth: 114300,
    };
    deepStrictEqual(result[49], { ...result[49], ...expectedResult49 });

    const expectedResult144: Partial<TreasuryBondsMonthlyResult> = {
      finalValueAtEndOfMath: 196888.29,
    };
    deepStrictEqual(result[144], { ...result[144], ...expectedResult144 });
  });
});
