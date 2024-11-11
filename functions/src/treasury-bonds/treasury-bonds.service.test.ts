import { deepStrictEqual } from 'assert';

import { COI, DOR, EDO, ROD, ROR, ROS, TOZ } from './treasury-bonds.consts';
import { CalculationParams, TreasuryBondsMonthlyResult } from './treasury-bonds.model';
import { calculate, createCalculationParamsByMonthFn } from './treasury-bonds.service';

describe('Calculate treasury bonds', () => {
  it('should work for ROR with 100 bonds', () => {
    const calculationParams: CalculationParams = {
      inflation: [0.01],
      referenceRate: [0.04],
      wibor6m: [0.04],
      savingsRate: [0.04],
    };
    const result = calculate(ROR, 100, 24, calculationParams);
    const expectedResult1: TreasuryBondsMonthlyResult = {
      rate: 0.0525,
      numberOfBonds: 100,
      nextNumberOfBonds: 100,
      buyCost: 10000,
      nextBuyCost: 10000,
      nominalValue: 10000,
      nextNominalValue: 10000,
      basisOfCapitalisation: 10000,
      nextBasisOfCapitalisation: 10000,
      maturity: false,
      valueAtEndOfMonth: 10043.75,
      earlyBuyoutPenalty: 43.75,
      buyoutAtEndOfMonth: 10000,

      profitAtEndOfMonth: 35.44,
      balanceAtEndOfMonth: 35.44,
      finalValueAtEndOfMath: 10000,
    };
    deepStrictEqual(result[1], expectedResult1);

    const expectedResult14: TreasuryBondsMonthlyResult = {
      rate: 0.04,
      numberOfBonds: 100,
      nextNumberOfBonds: 100,
      buyCost: 9990,
      nextBuyCost: 9990,
      nominalValue: 10000,
      nextNominalValue: 10000,
      basisOfCapitalisation: 10000,
      nextBasisOfCapitalisation: 10000,
      maturity: false,
      valueAtEndOfMonth: 10033.33,
      earlyBuyoutPenalty: 50,
      buyoutAtEndOfMonth: 9986.5,

      profitAtEndOfMonth: 27,
      balanceAtEndOfMonth: 411.96,
      finalValueAtEndOfMath: 10371.46,
    };
    deepStrictEqual(result[14], expectedResult14);

    const expectedResult24: TreasuryBondsMonthlyResult = {
      rate: 0.04,
      numberOfBonds: 100,
      nextNumberOfBonds: 100,
      buyCost: 9990,
      nextBuyCost: 9990,
      nominalValue: 10000,
      nextNominalValue: 10000,
      basisOfCapitalisation: 10000,
      nextBasisOfCapitalisation: 10000,
      maturity: true,
      valueAtEndOfMonth: 10033.33,
      earlyBuyoutPenalty: 0,
      buyoutAtEndOfMonth: 10027,

      profitAtEndOfMonth: 37,
      balanceAtEndOfMonth: 706.52,
      finalValueAtEndOfMath: 10696.52,
    };
    deepStrictEqual(result[24], expectedResult24);
  });

  it('should work for ROR with 10000 bonds', () => {
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

  it('should work for ROR with 100 bonds and progressive params', () => {
    const calculationParams: CalculationParams = {
      inflation: [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12],
      referenceRate: [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12],
      wibor6m: [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12],
      savingsRate: [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12],
    };
    const result = calculate(ROR, 100, 144, calculationParams);
    const expectedResult144: Partial<TreasuryBondsMonthlyResult> = {
      finalValueAtEndOfMath: 18859.09,
    };
    deepStrictEqual(result[144], { ...result[144], ...expectedResult144 });
  });

  it('should work for DOR with 10000 bonds', () => {
    const calculationParams: CalculationParams = {
      inflation: [0.1],
      referenceRate: [0.04],
      wibor6m: [0.04],
      savingsRate: [0.04],
    };
    const result = calculate(DOR, 10000, 51, calculationParams);
    const expectedResult1: TreasuryBondsMonthlyResult = {
      rate: 0.055,
      numberOfBonds: 10000,
      nextNumberOfBonds: 10000,
      buyCost: 1000000,
      nextBuyCost: 1000000,
      nominalValue: 1000000,
      nextNominalValue: 1000000,
      basisOfCapitalisation: 1000000,
      nextBasisOfCapitalisation: 1000000,
      maturity: false,
      valueAtEndOfMonth: 1004583.33,
      earlyBuyoutPenalty: 4583.33,
      buyoutAtEndOfMonth: 1000000,

      profitAtEndOfMonth: 3712.5,
      balanceAtEndOfMonth: 3712.5,
      finalValueAtEndOfMath: 1000000,
    };
    deepStrictEqual(result[1], expectedResult1);

    const expectedResult50: Partial<TreasuryBondsMonthlyResult> = {
      rate: 0.0425,
      numberOfBonds: 10076,
      nextNumberOfBonds: 10076,
      buyCost: 1006592.4,
      nextBuyCost: 1006592.4,
      nominalValue: 1007600,
      nextNominalValue: 1007600,
      basisOfCapitalisation: 1007600,
      nextBasisOfCapitalisation: 1007600,
      maturity: false,
      valueAtEndOfMonth: 1011168.58,
      earlyBuyoutPenalty: 7053.2,
      buyoutAtEndOfMonth: 1004777.46,

      profitAtEndOfMonth: 2890.55,
      balanceAtEndOfMonth: 150578.8,
      finalValueAtEndOfMath: 1152465.71,
    };
    deepStrictEqual(result[50], expectedResult50);
  });

  it('should work for TOZ with 300 bonds', () => {
    const calculationParams: CalculationParams = {
      inflation: [0.01],
      referenceRate: [0.04],
      wibor6m: [0.04],
      savingsRate: [0.04],
    };
    const result = calculate(TOZ, 300, 96, calculationParams);

    const expectedResult1: TreasuryBondsMonthlyResult = {
      rate: 0.055,
      numberOfBonds: 300,
      nextNumberOfBonds: 300,
      buyCost: 30000,
      nextBuyCost: 30000,
      nominalValue: 30000,
      nextNominalValue: 30000,
      basisOfCapitalisation: 30000,
      nextBasisOfCapitalisation: 30000,
      maturity: false,
      valueAtEndOfMonth: 30137.5,
      earlyBuyoutPenalty: 137.5,
      buyoutAtEndOfMonth: 30000,

      profitAtEndOfMonth: 0,
      balanceAtEndOfMonth: 0,
      finalValueAtEndOfMath: 30000,
    };
    deepStrictEqual(result[1], expectedResult1);

    const expectedResult2: Partial<TreasuryBondsMonthlyResult> = {
      rate: 0.055,
      numberOfBonds: 300,
      nextNumberOfBonds: 300,
      buyCost: 30000,
      nextBuyCost: 30000,
      valueAtEndOfMonth: 30275,
      earlyBuyoutPenalty: 210,
      buyoutAtEndOfMonth: 30052.65,

      profitAtEndOfMonth: 0,
      balanceAtEndOfMonth: 0,
      finalValueAtEndOfMath: 30052.65,
    };
    deepStrictEqual(result[2], { ...result[2], ...expectedResult2 });

    const expectedResult37: Partial<TreasuryBondsMonthlyResult> = {
      rate: 0.055,
      numberOfBonds: 305,
      nextNumberOfBonds: 305,
      buyCost: 30469.5,
      nextBuyCost: 30469.5,
      valueAtEndOfMonth: 30639.79,
      earlyBuyoutPenalty: 139.79,
      buyoutAtEndOfMonth: 30500.0,

      profitAtEndOfMonth: 0,
      balanceAtEndOfMonth: 2773.09,
      finalValueAtEndOfMath: 33273.09,
    };
    deepStrictEqual(result[37], { ...result[37], ...expectedResult37 });
  });

  it('should work for COI with 4000 bonds', () => {
    const calculationParams: CalculationParams = {
      inflation: [0.01],
      referenceRate: [0.04],
      wibor6m: [0.04],
      savingsRate: [0.04],
    };
    const result = calculate(COI, 4000, 144, calculationParams);

    const expectedResult144: Partial<TreasuryBondsMonthlyResult> = {
      rate: 0.02,
      numberOfBonds: 4138,
      buyCost: 413386.2,
      nominalValue: 413800.0,
      maturity: true,
      valueAtEndOfMonth: 422076.0,
      earlyBuyoutPenalty: 0,
      buyoutAtEndOfMonth: 420503.56,

      balanceAtEndOfMonth: 116050.03,
      finalValueAtEndOfMath: 536553.59,
    };
    deepStrictEqual(result[144], { ...result[144], ...expectedResult144 });
  });

  it('should work for EDO with 50 bonds', () => {
    const calculationParams: CalculationParams = {
      inflation: [0.01],
      referenceRate: [0.04],
      wibor6m: [0.04],
      savingsRate: [0.04],
    };
    const result = calculate(EDO, 50, 144, calculationParams);
    const expectedResult144: Partial<TreasuryBondsMonthlyResult> = {
      rate: 0.0225,
      numberOfBonds: 61,
      buyCost: 6093.9,
      nominalValue: 6100,
      maturity: false,
      valueAtEndOfMonth: 6595.89,
      basisOfCapitalisation: 6450.75,
      earlyBuyoutPenalty: 122,
      buyoutAtEndOfMonth: 6402.85,
      finalValueAtEndOfMath: 6497.32,
    };
    deepStrictEqual(result[144], { ...result[144], ...expectedResult144 });
  });

  it('should work for ROS with 124 bonds', () => {
    const calculationParams: CalculationParams = {
      inflation: [0.01],
      referenceRate: [0.04],
      wibor6m: [0.04],
      savingsRate: [0.04],
    };
    const result = calculate(ROS, 124, 144, calculationParams);
    const expectedResult144: Partial<TreasuryBondsMonthlyResult> = {
      rate: 0.025,
      numberOfBonds: 143,
      buyCost: 14300,
      nominalValue: 14300,
      maturity: true,
      valueAtEndOfMonth: 17101.35,
      basisOfCapitalisation: 16684.24,
      earlyBuyoutPenalty: 0,
      buyoutAtEndOfMonth: 16569.09,
      finalValueAtEndOfMath: 16651.18,
    };
    deepStrictEqual(result[144], { ...result[144], ...expectedResult144 });
  });

  it('should work for ROD with 999 bonds', () => {
    const calculationParams: CalculationParams = {
      inflation: [0.01],
      referenceRate: [0.04],
      wibor6m: [0.04],
      savingsRate: [0.04],
    };
    const result = calculate(ROD, 999, 144, calculationParams);
    const expectedResult144: Partial<TreasuryBondsMonthlyResult> = {
      rate: 0.0275,
      numberOfBonds: 999,
      buyCost: 99900,
      nominalValue: 99900,
      maturity: true,
      valueAtEndOfMonth: 142715.61,
      basisOfCapitalisation: 138895.97,
      earlyBuyoutPenalty: 0,
      buyoutAtEndOfMonth: 134580.65,
      finalValueAtEndOfMath: 134580.65,
    };
    deepStrictEqual(result[144], { ...result[144], ...expectedResult144 });
  });
});

describe('Treasury bonds params', () => {
  it('should return proper values for given month', () => {
    const params: CalculationParams = {
      inflation: [1],
      referenceRate: [1, 2],
      savingsRate: [1, 2, 3],
      wibor6m: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    };

    const expected = {
      inflation: 1,
      referenceRate: 2,
      savingsRate: 3,
      wibor6m: 4,
    };
    const fn = createCalculationParamsByMonthFn(params);
    deepStrictEqual(fn(37), expected);
  });
});
