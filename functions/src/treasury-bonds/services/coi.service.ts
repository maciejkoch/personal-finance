import { mapValues } from 'lodash';
import { getNOrLastValue } from '../../calculations/calculations.service';
import { COI } from '../treasury-bonds.consts';
import {
  CalculateByTreasuryBonds,
  CalculationParams,
  CalculationParamsByMonthFn,
  TreasuryBonds,
  TreasuryBondsMonthlyResult,
  TreasuryBondsResult,
} from '../treasury-bonds.model';

const TAX = 0.19;
const BOND_COST = 100;

export function calculate(
  initialNumberOfBonds: number,
  maxMonth: number,
  calculationParams: CalculationParams
): TreasuryBondsResult {
  const calculateForMonth = calculateForMonthFactory(
    COI,
    initialNumberOfBonds,
    calculationParams
  );

  const months = [...Array(maxMonth).keys()].map((i) => i + 1);
  const result = months.reduce<TreasuryBondsResult>(
    (acc, month) => ({
      ...acc,
      [month]: calculateForMonth(month, acc[month - 1]),
    }),
    {}
  );

  return normalizeResult(result);
}

function normalizeResult(result: TreasuryBondsResult): TreasuryBondsResult {
  const toDecimal = (value: number, digits = 2) => +value.toFixed(digits);

  return mapValues(result, (value) => ({
    ...value,
    rate: toDecimal(value.rate, 4),
    buyCost: toDecimal(value.buyCost),
    nextBuyCost: toDecimal(value.nextBuyCost),
    basisOfCapitalisation: toDecimal(value.basisOfCapitalisation),
    valueAtEndOfMonth: toDecimal(value.valueAtEndOfMonth),
    earlyBuyoutPenalty: toDecimal(value.earlyBuyoutPenalty),
    buyoutAtEndOfMonth: toDecimal(value.buyoutAtEndOfMonth),

    profitAtEndOfMonth: toDecimal(value.profitAtEndOfMonth),
    balanceAtEndOfMonth: toDecimal(value.balanceAtEndOfMonth),
    finalValueAtEndOfMath: toDecimal(value.finalValueAtEndOfMath),
  }));
}

function calculateForMonthFactory(
  treasuryBonds: TreasuryBonds,
  initialNumberOfBonds: number,
  calculationParams: CalculationParams
): (
  month: number,
  previousMonthResult: TreasuryBondsMonthlyResult
) => TreasuryBondsMonthlyResult {
  const calculateParamsByMonth =
    createCalculationParamsByMonthFn(calculationParams);

  return (month, previousMonthResult) => {
    const currentCalculationParams = calculateParamsByMonth(month);
    const indexation = currentCalculationParams[treasuryBonds.indexation];
    const savingsRate = currentCalculationParams.savingsRate;

    const amount = initialNumberOfBonds * BOND_COST;

    const maturity = month % treasuryBonds.maturityInMonths === 0;
    const numberOfBonds =
      previousMonthResult?.nextNumberOfBonds || initialNumberOfBonds;
    const buyCost = previousMonthResult?.nextBuyCost || amount;
    const nominalValue = previousMonthResult?.nextNominalValue || amount;
    const basisOfCapitalisation =
      previousMonthResult?.nextBasisOfCapitalisation || nominalValue;
    const rate = calculateRate(maturity, indexation)(treasuryBonds, month);
    const valueAtEndOfMonth = calculateValueAtEndOfMonth(
      basisOfCapitalisation,
      rate
    )(treasuryBonds, month);
    const earlyBuyoutPenalty = calculateEarlyBuyoutPenalty(
      nominalValue,
      maturity,
      numberOfBonds,
      valueAtEndOfMonth
    )(treasuryBonds, month);
    const buyoutAtEndOfMonth = calculateBuyoutAtEndOfMonth(
      nominalValue,
      valueAtEndOfMonth,
      earlyBuyoutPenalty
    );
    const profitAtEndOfMonth = calculateProfitAtEndOfMonth(
      maturity,
      valueAtEndOfMonth,
      nominalValue,
      buyoutAtEndOfMonth
    )(treasuryBonds, month);
    const previousBalance = previousMonthResult?.balanceAtEndOfMonth || 0;
    const previousMaturity = previousMonthResult?.maturity || false;
    const balanceAtEndOfMonth = calculateBalanceAtEndOfMonth(
      previousMaturity,
      previousBalance,
      savingsRate,
      profitAtEndOfMonth
    );

    const nextNumberOfBonds = calculateNextNumberOfBonds(
      numberOfBonds,
      maturity,
      buyoutAtEndOfMonth,
      balanceAtEndOfMonth
    )(treasuryBonds);
    const nextBuyCost = calculateNextBuyCost(
      maturity,
      buyCost,
      buyoutAtEndOfMonth,
      balanceAtEndOfMonth
    )(treasuryBonds);
    const nextNominalValue = calculateNextNominalValue(
      nextNumberOfBonds,
      maturity,
      nominalValue
    );
    const nextBasisOfCapitalisation = calculateNextBasisOfCapitalisation(
      treasuryBonds,
      month,
      maturity,
      nextNominalValue,
      basisOfCapitalisation,
      valueAtEndOfMonth
    );

    const previousBalanceAtEndOfMonth =
      previousMonthResult?.balanceAtEndOfMonth || 0;
    const finalValueAtEndOfMath = calculateFinalValueAtEndOfMath(
      previousBalanceAtEndOfMonth,
      savingsRate,
      buyoutAtEndOfMonth
    )(treasuryBonds, month);

    return {
      numberOfBonds,
      nextNumberOfBonds,
      buyCost,
      nextBuyCost,
      nominalValue,
      nextNominalValue,
      basisOfCapitalisation,
      nextBasisOfCapitalisation,
      rate,
      maturity,
      valueAtEndOfMonth,
      earlyBuyoutPenalty,
      buyoutAtEndOfMonth,
      profitAtEndOfMonth,
      balanceAtEndOfMonth,
      finalValueAtEndOfMath,
    };
  };
}

function calculateRate(
  maturity: boolean,
  indexation: number
): CalculateByTreasuryBonds {
  return (treasuryBonds, month) => {
    const isFirstPeriod =
      month! % treasuryBonds.maturityInMonths <=
        treasuryBonds.rateUpdateInMonths && !maturity;
    return isFirstPeriod
      ? treasuryBonds.firstPeriodRate
      : treasuryBonds.margin + indexation;
  };
}

function calculateValueAtEndOfMonth(
  amount: number,
  rate: number
): CalculateByTreasuryBonds {
  return (treasuryBonds, month) => {
    const interestCalculationInMonths =
      treasuryBonds.paymentOfInterestInMonths ||
      treasuryBonds.capitalizationOfInterestInMonths;
    const paymentOfInterest =
      (month! % interestCalculationInMonths || interestCalculationInMonths) /
      12;
    return amount * (1 + rate * paymentOfInterest);
  };
}

function calculateEarlyBuyoutPenalty(
  nominalValue: number,
  maturity: boolean,
  numberOfBonds: number,
  valueAtEndOfMonth: number
): CalculateByTreasuryBonds {
  return (treasuryBonds, month) => {
    const profit = valueAtEndOfMonth - nominalValue;
    const protection =
      month! % treasuryBonds.maturityInMonths <=
      treasuryBonds.buyoutProtectionInMonths;
    const penalty = numberOfBonds * treasuryBonds.earlyBuyoutCost;
    return maturity ? 0 : protection ? Math.min(profit, penalty) : penalty;
  };
}

function calculateBuyoutAtEndOfMonth(
  nominalValue: number,
  valueAtEndOfMonth: number,
  earlyBuyoutPenalty: number
): number {
  return (
    valueAtEndOfMonth -
    earlyBuyoutPenalty -
    (valueAtEndOfMonth - earlyBuyoutPenalty - nominalValue) * TAX
  );
}

function calculateNextBuyCost(
  maturity: boolean,
  buyCost: number,
  buyoutAtEndOfMonth: number,
  balanceAtEndOfMonth: number
): CalculateByTreasuryBonds {
  return (treasuryBonds) => {
    if (!maturity) {
      return buyCost;
    }

    return (
      Math.floor(buyoutAtEndOfMonth / treasuryBonds.exchangeCost) *
        treasuryBonds.exchangeCost +
      Math.floor(balanceAtEndOfMonth / 100) * 100
    );
  };
}

function calculateNextNumberOfBonds(
  numberOfBonds: number,
  maturity: boolean,
  buyoutAtEndOfMonth: number,
  balanceAtEndOfMonth: number
): CalculateByTreasuryBonds {
  return (treasuryBonds) => {
    if (!maturity) {
      return numberOfBonds;
    }

    return (
      Math.floor(buyoutAtEndOfMonth / treasuryBonds.exchangeCost) +
      Math.floor(balanceAtEndOfMonth / 100)
    );
  };
}

function calculateNextNominalValue(
  nextNumberOfBonds: number,
  maturity: boolean,
  nominalValue: number
): number {
  return maturity ? nextNumberOfBonds * BOND_COST : nominalValue;
}

function calculateProfitAtEndOfMonth(
  maturity: boolean,
  valueAtEndOfMonth: number,
  nominalValue: number,
  buyoutAtEndOfMonth: number
): CalculateByTreasuryBonds {
  return (treasuryBonds, month) => {
    if (maturity) {
      return (
        buyoutAtEndOfMonth -
        Math.floor(buyoutAtEndOfMonth / treasuryBonds.exchangeCost) *
          treasuryBonds.exchangeCost
      );
    }

    if (month! % treasuryBonds.paymentOfInterestInMonths === 0) {
      return (valueAtEndOfMonth - nominalValue) * (1 - TAX);
    }

    return 0;
  };
}

function calculateBalanceAtEndOfMonth(
  previousMaturity: boolean,
  previousBalance: number,
  savingsRate: number,
  profitAtEndOfMonth: number
): number {
  return (
    (previousBalance -
      (previousMaturity ? Math.floor(previousBalance / 100) * 100 : 0)) *
      (1 + (savingsRate / 12) * (1 - TAX)) +
    profitAtEndOfMonth
  );
}

function calculateNextBasisOfCapitalisation(
  treasuryBonds: TreasuryBonds,
  month: number,
  maturity: boolean,
  nextNominalValue: number,
  basisOfCapitalisation: number,
  valueAtEndOfMonth: number
): number {
  if (!treasuryBonds.capitalizationOfInterestInMonths) {
    return nextNominalValue;
  }

  return maturity
    ? nextNominalValue
    : (month + 1) % treasuryBonds.capitalizationOfInterestInMonths !== 1
    ? basisOfCapitalisation
    : valueAtEndOfMonth;
}

function calculateFinalValueAtEndOfMath(
  previousBalanceAtEndOfMonth: number,
  savingsRate: number,
  buyoutAtEndOfMonth: number
): CalculateByTreasuryBonds {
  return (treasuryBonds, month) => {
    const previousMaturity =
      (month! - 1) % treasuryBonds.maturityInMonths === 0;
    const value = previousMaturity
      ? Math.floor(previousBalanceAtEndOfMonth / 100) * 100
      : 0;

    return (
      (previousBalanceAtEndOfMonth - value) *
        (1 + (savingsRate / 12) * (1 - TAX)) +
      buyoutAtEndOfMonth
    );
  };
}

export function createCalculationParamsByMonthFn(
  params: CalculationParams
): CalculationParamsByMonthFn {
  return (month) => {
    const year = Math.ceil(month / 12);
    return {
      inflation: getNOrLastValue(params.inflation, year - 1),
      referenceRate: getNOrLastValue(params.referenceRate, year), // to remove
      savingsRate: getNOrLastValue(params.savingsRate, year),
      wibor6m: getNOrLastValue(params.wibor6m, year), // to remove
    };
  };
}
