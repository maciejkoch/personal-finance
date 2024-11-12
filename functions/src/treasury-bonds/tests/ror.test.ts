import { deepStrictEqual } from 'assert';

import { ROR } from '../treasury-bonds.consts';
import {
  CalculationParams,
  TreasuryBondsMonthlyResult,
} from '../treasury-bonds.model';
import { calculate } from '../treasury-bonds.service';

describe('Calculate treasury bonds', () => {
  it('should work for ROR with 100 bonds', () => {
    const calculationParams: CalculationParams = {
      inflation: [0.049],
      referenceRate: [0.0575],
      wibor6m: [0.0584],
      savingsRate: [0.06],
    };
    const result = calculate(ROR, 100, 144, calculationParams);

    const expectedResult1: TreasuryBondsMonthlyResult = {
      rate: 0.0575,
      numberOfBonds: 100,
      nextNumberOfBonds: 100,
      buyCost: 10000,
      nextBuyCost: 10000,
      nominalValue: 10000,
      nextNominalValue: 10000,
      basisOfCapitalisation: 10000,
      nextBasisOfCapitalisation: 10000,
      maturity: false,
      valueAtEndOfMonth: 10047.92,
      earlyBuyoutPenalty: 47.92,
      buyoutAtEndOfMonth: 10000,

      profitAtEndOfMonth: 38.81,
      balanceAtEndOfMonth: 38.81,
      finalValueAtEndOfMath: 10000,
    };
    deepStrictEqual(result[1], expectedResult1);

    const expectedResult12: TreasuryBondsMonthlyResult = {
      rate: 0.0575,
      numberOfBonds: 100,
      nextNumberOfBonds: 104,
      buyCost: 10000,
      nextBuyCost: 10390,
      nominalValue: 10000,
      nextNominalValue: 10400,
      basisOfCapitalisation: 10000,
      nextBasisOfCapitalisation: 10400,
      maturity: true,
      valueAtEndOfMonth: 10047.92,
      earlyBuyoutPenalty: 0,
      buyoutAtEndOfMonth: 10038.81,

      profitAtEndOfMonth: 48.81,
      balanceAtEndOfMonth: 486.27,
      finalValueAtEndOfMath: 10476.27,
    };
    deepStrictEqual(result[12], expectedResult12);

    const expectedResult14: TreasuryBondsMonthlyResult = {
      rate: 0.0575,
      numberOfBonds: 104,
      nextNumberOfBonds: 104,
      buyCost: 10390,
      nextBuyCost: 10390,
      nominalValue: 10400,
      nextNominalValue: 10400,
      basisOfCapitalisation: 10400,
      nextBasisOfCapitalisation: 10400,
      maturity: false,
      valueAtEndOfMonth: 10449.83,
      earlyBuyoutPenalty: 52,
      buyoutAtEndOfMonth: 10398.25,

      profitAtEndOfMonth: 40.37,
      balanceAtEndOfMonth: 167.86,
      finalValueAtEndOfMath: 10525.74,
    };
    deepStrictEqual(result[14], expectedResult14);

    const expectedResult144: TreasuryBondsMonthlyResult = {
      rate: 0.0575,
      numberOfBonds: 168,
      nextNumberOfBonds: 175,
      buyCost: 16784,
      nextBuyCost: 17483.2,
      nominalValue: 16800,
      nextNominalValue: 17500,
      basisOfCapitalisation: 16800,
      nextBasisOfCapitalisation: 17500,
      maturity: true,
      valueAtEndOfMonth: 16880.5,
      earlyBuyoutPenalty: 0,
      buyoutAtEndOfMonth: 16865.21,

      profitAtEndOfMonth: 0,
      balanceAtEndOfMonth: 797.71,
      finalValueAtEndOfMath: 17662.91,
    };
    deepStrictEqual(result[144], expectedResult144);
  });

  it('should work for ROR with 1000 bonds and progressive params', () => {
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
    const result = calculate(ROR, 1000, 144, calculationParams);
    const expectedResult144: Partial<TreasuryBondsMonthlyResult> = {
      finalValueAtEndOfMath: 197714.48,
    };
    deepStrictEqual(result[144], { ...result[144], ...expectedResult144 });
  });
});
