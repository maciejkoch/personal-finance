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

    // const expectedResult14: TreasuryBondsMonthlyResult = {
    //   rate: 0.04,
    //   numberOfBonds: 100,
    //   nextNumberOfBonds: 100,
    //   buyCost: 9990,
    //   nextBuyCost: 9990,
    //   nominalValue: 10000,
    //   nextNominalValue: 10000,
    //   basisOfCapitalisation: 10000,
    //   nextBasisOfCapitalisation: 10000,
    //   maturity: false,
    //   valueAtEndOfMonth: 10033.33,
    //   earlyBuyoutPenalty: 50,
    //   buyoutAtEndOfMonth: 9986.5,

    //   profitAtEndOfMonth: 27,
    //   balanceAtEndOfMonth: 411.96,
    //   finalValueAtEndOfMath: 10371.46,
    // };
    // deepStrictEqual(result[14], expectedResult14);

    // const expectedResult24: TreasuryBondsMonthlyResult = {
    //   rate: 0.04,
    //   numberOfBonds: 100,
    //   nextNumberOfBonds: 100,
    //   buyCost: 9990,
    //   nextBuyCost: 9990,
    //   nominalValue: 10000,
    //   nextNominalValue: 10000,
    //   basisOfCapitalisation: 10000,
    //   nextBasisOfCapitalisation: 10000,
    //   maturity: true,
    //   valueAtEndOfMonth: 10033.33,
    //   earlyBuyoutPenalty: 0,
    //   buyoutAtEndOfMonth: 10027,

    //   profitAtEndOfMonth: 37,
    //   balanceAtEndOfMonth: 706.52,
    //   finalValueAtEndOfMath: 10696.52,
    // };
    // deepStrictEqual(result[24], expectedResult24);
  });

  xit('should work for ROR with 10000 bonds', () => {
    const calculationParams: CalculationParams = {
      inflation: [0.1],
      referenceRate: [0.04],
      wibor6m: [0.04],
      savingsRate: [0.04],
    };
    const result = calculate(ROR, 10000, 50, calculationParams);

    const expectedResult1: TreasuryBondsMonthlyResult = {
      rate: 0.0525,
      numberOfBonds: 10000,
      nextNumberOfBonds: 10000,
      buyCost: 1000000,
      nextBuyCost: 1000000,
      nominalValue: 1000000,
      nextNominalValue: 1000000,
      basisOfCapitalisation: 1000000,
      nextBasisOfCapitalisation: 1000000,
      maturity: false,
      valueAtEndOfMonth: 1004375,
      earlyBuyoutPenalty: 4375,
      buyoutAtEndOfMonth: 1000000,

      profitAtEndOfMonth: 3543.75,
      balanceAtEndOfMonth: 3543.75,
      finalValueAtEndOfMath: 1000000,
    };
    deepStrictEqual(result[1], expectedResult1);

    const expectedResult2: TreasuryBondsMonthlyResult = {
      rate: 0.04,
      numberOfBonds: 10000,
      nextNumberOfBonds: 10000,
      buyCost: 1000000,
      nextBuyCost: 1000000,
      nominalValue: 1000000,
      nextNominalValue: 1000000,
      basisOfCapitalisation: 1000000,
      nextBasisOfCapitalisation: 1000000,
      maturity: false,
      valueAtEndOfMonth: 1003333.33,
      earlyBuyoutPenalty: 5000,
      buyoutAtEndOfMonth: 998650,

      profitAtEndOfMonth: 2700,
      balanceAtEndOfMonth: 6253.32,
      finalValueAtEndOfMath: 1002203.32,
    };
    deepStrictEqual(result[2], expectedResult2);

    const expectedResult12: TreasuryBondsMonthlyResult = {
      rate: 0.04,
      numberOfBonds: 10000,
      nextNumberOfBonds: 10037,
      buyCost: 1000000,
      nextBuyCost: 1002696.3,
      nominalValue: 1000000,
      nextNominalValue: 1003700,
      basisOfCapitalisation: 1000000,
      nextBasisOfCapitalisation: 1003700,
      maturity: true,
      valueAtEndOfMonth: 1003333.33,
      earlyBuyoutPenalty: 0,
      buyoutAtEndOfMonth: 1002700.0,

      profitAtEndOfMonth: 3.7,
      balanceAtEndOfMonth: 31058.35,
      finalValueAtEndOfMath: 1033754.65,
    };
    deepStrictEqual(result[12], expectedResult12);

    const expectedResult13: TreasuryBondsMonthlyResult = {
      rate: 0.0525,
      numberOfBonds: 10037,
      nextNumberOfBonds: 10037,
      buyCost: 1002696.3,
      nextBuyCost: 1002696.3,
      nominalValue: 1003700,
      nextNominalValue: 1003700,
      basisOfCapitalisation: 1003700,
      nextBasisOfCapitalisation: 1003700,
      maturity: false,
      valueAtEndOfMonth: 1008091.19,
      earlyBuyoutPenalty: 4391.19,
      buyoutAtEndOfMonth: 1003700.0,

      profitAtEndOfMonth: 3556.86,
      balanceAtEndOfMonth: 34699.07,
      finalValueAtEndOfMath: 1034842.2,
    };
    deepStrictEqual(result[13], expectedResult13);

    const expectedResult50: TreasuryBondsMonthlyResult = {
      rate: 0.04,
      numberOfBonds: 10148,
      nextNumberOfBonds: 10148,
      buyCost: 1013785.2,
      nextBuyCost: 1013785.2,
      nominalValue: 1014800,
      nextNominalValue: 1014800,
      basisOfCapitalisation: 1014800,
      nextBasisOfCapitalisation: 1014800,
      maturity: false,
      valueAtEndOfMonth: 1018182.67,
      earlyBuyoutPenalty: 5074,
      buyoutAtEndOfMonth: 1013430.02,

      profitAtEndOfMonth: 2739.96,
      balanceAtEndOfMonth: 138341.44,
      finalValueAtEndOfMath: 1149031.5,
    };
    deepStrictEqual(result[50], expectedResult50);
  });

  xit('should work for ROR with 100 bonds and progressive params', () => {
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
    const result = calculate(ROR, 100, 144, calculationParams);
    const expectedResult144: Partial<TreasuryBondsMonthlyResult> = {
      finalValueAtEndOfMath: 18859.09,
    };
    deepStrictEqual(result[144], { ...result[144], ...expectedResult144 });
  });
});
