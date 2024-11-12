import { mapValues } from 'lodash';
import { getNOrLastValue } from '../calculations/calculations.service';
import {
  CalculateByTreasuryBonds,
  CalculationParams,
  CalculationParamsByMonthFn,
  TreasuryBonds,
  TreasuryBondsMonthlyResult,
  TreasuryBondsResult,
  TreasuryBondsSimpleResult,
} from './treasury-bonds.model';

const TAX = 0.19;
const BOND_COST = 100;
const MAX_MONTH = 144;

export function calculate(
  treasuryBonds: TreasuryBonds,
  initialNumberOfBonds: number,
  maxMonth: number,
  calculationParams: CalculationParams
): TreasuryBondsResult {
  const calculateForMonth = calculateForMonthFactory(
    treasuryBonds,
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

export function simplifyResult(
  result: TreasuryBondsResult
): TreasuryBondsSimpleResult {
  return mapValues(result, (value) => value.finalValueAtEndOfMath);
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
      nominalValue
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
  nominalValue: number
): CalculateByTreasuryBonds {
  return (treasuryBonds, month) => {
    if (month! >= MAX_MONTH) {
      return 0;
    }

    //     =IF(MOD($AA55;wyplata_odsetek_ROR)=0; (AJ55-AG55)*(1-podatek_Belki);0)
    // +IF(AK55="tak";ROUNDDOWN(AJ55/zamiana_ROR;0)*(100-zamiana_ROR);0)
    // aa55 - miesiac
    // wyplata_odsetek_ROR - co ile miesiecy wyplata odsetek
    // AJ55 - wartosc na koniec miesiaca
    // AG55 - nominalna wartosc

    const profitIfNoPayment = (valueAtEndOfMonth - nominalValue) * (1 - TAX);
    const profit =
      month! % treasuryBonds.paymentOfInterestInMonths ? 0 : profitIfNoPayment;
    // jak to nazwac?
    const test = maturity
      ? Math.floor(valueAtEndOfMonth / treasuryBonds.exchangeCost) *
        (100 - treasuryBonds.exchangeCost)
      : 0;

    return profit + test;

    // const isPaymentOfInterest = treasuryBonds.paymentOfInterestInMonths;

    // const profitIfNoPayment = (valueAtEndOfMonth - nominalValue) * (1 - TAX);
    // const profit =
    //   month! % treasuryBonds.paymentOfInterestInMonths ? 0 : profitIfNoPayment;
    // const nextCost = maturity && nextBuyCost ? nextBuyCost - nominalValue : 0;
    // const withPaymentOfInterest = profit - nextCost;

    // const withoutPaymentOfInterest = maturity
    //   ? buyoutAtEndOfMonth - nextBuyCost
    //   : 0;

    // return isPaymentOfInterest
    //   ? withPaymentOfInterest
    //   : withoutPaymentOfInterest;
  };
}

function calculateBalanceAtEndOfMonth(
  previousMaturity: boolean,
  previousBalance: number,
  savingsRate: number,
  profitAtEndOfMonth: number
): number {
  //   =(AP54-IF(AK54="tak";ROUNDDOWN(AP54/100;0)*100;0))*
  // (1+AO55/12*(1-podatek_Belki))+AN55
  // AP54 - poprzedni balance
  // AK54 - czy jest zapadalnosc
  // AO55 - stopa oprocentowania
  // AN55 - zysk na koniec miesiaca

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
