import { mapValues } from 'lodash';
import { getNOrLastValue } from '../../calculations/calculations.service';
import { TOS } from '../treasury-bonds.consts';
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
const MAX_MONTH = 144;

export function calculate(
  initialNumberOfBonds: number,
  maxMonth: number,
  calculationParams: CalculationParams
): TreasuryBondsResult {
  const calculateForMonth = calculateForMonthFactory(
    TOS,
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
    const savingsRate = currentCalculationParams.savingsRate;

    const amount = initialNumberOfBonds * BOND_COST;

    const maturity = month % treasuryBonds.maturityInMonths === 0;
    const numberOfBonds =
      previousMonthResult?.nextNumberOfBonds || initialNumberOfBonds;
    const buyCost = previousMonthResult?.nextBuyCost || amount;
    const nominalValue = previousMonthResult?.nextNominalValue || amount;
    const basisOfCapitalisation =
      previousMonthResult?.nextBasisOfCapitalisation || nominalValue;
    const rate = calculateRate()(treasuryBonds, month);

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

    const nextNumberOfBonds = calculateNextNumberOfBonds(
      numberOfBonds,
      maturity,
      buyoutAtEndOfMonth
    )(treasuryBonds);
    const nextBuyCost = calculateNextBuyCost(
      maturity,
      buyCost,
      nextNumberOfBonds
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
    const profitAtEndOfMonth = calculateProfitAtEndOfMonth(
      maturity,
      buyoutAtEndOfMonth,
      nextBuyCost
    )(treasuryBonds, month);
    const previousBalance = previousMonthResult?.balanceAtEndOfMonth || 0;
    const balanceAtEndOfMonth = calculateBalanceAtEndOfMonth(
      previousBalance,
      savingsRate,
      profitAtEndOfMonth
    );

    const finalValueAtEndOfMath =
      previousBalance * (1 + (savingsRate / 12) * (1 - TAX)) +
      buyoutAtEndOfMonth;

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

function calculateRate(): CalculateByTreasuryBonds {
  return (treasuryBonds, month) => {
    // oprocentowanie stale
    return treasuryBonds.firstPeriodRate;
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
  nextNumberOfBonds: number
): CalculateByTreasuryBonds {
  return (treasuryBonds) => {
    if (!maturity) {
      return buyCost;
    }

    return nextNumberOfBonds * treasuryBonds.exchangeCost;
  };
}

function calculateNextNumberOfBonds(
  numberOfBonds: number,
  maturity: boolean,
  buyoutAtEndOfMonth: number
): CalculateByTreasuryBonds {
  return (treasuryBonds) => {
    if (!maturity) {
      return numberOfBonds;
    }

    return Math.floor(buyoutAtEndOfMonth / treasuryBonds.exchangeCost);
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
  buyoutAtEndOfMonth: number,
  nextBuyCost: number
): CalculateByTreasuryBonds {
  return (treasuryBonds, month) => {
    if (month! >= MAX_MONTH) {
      return 0;
    }

    return maturity ? buyoutAtEndOfMonth - nextBuyCost : 0;
  };
}

function calculateBalanceAtEndOfMonth(
  previousBalance: number,
  savingsRate: number,
  profitAtEndOfMonth: number
): number {
  return (
    previousBalance * (1 + (savingsRate / 12) * (1 - TAX)) + profitAtEndOfMonth
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
  return maturity
    ? nextNominalValue
    : (month + 1) % treasuryBonds.capitalizationOfInterestInMonths !== 1
    ? basisOfCapitalisation
    : valueAtEndOfMonth;
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
