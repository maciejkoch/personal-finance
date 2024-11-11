export enum Indexation {
  wibor6m = 'wibor6m',
  inflation = 'inflation',
  referenceRate = 'referenceRate',
}

export interface CalculationParams {
  inflation: number[];
  wibor6m: number[];
  referenceRate: number[];
  savingsRate: number[];
}

export interface TreasuryBonds {
  name: string;
  maturityInMonths: number; // zapadalnosc
  firstPeriodRate: number;
  rateUpdateInMonths: number;
  indexation: Indexation;
  margin: number;
  paymentOfInterestInMonths: number;
  capitalizationOfInterestInMonths: number;
  exchangeCost: number;
  earlyBuyoutCost: number;
  buyoutProtectionInMonths: number;
}

export interface TreasuryBondsMonthlyResult {
  rate: number;
  maturity: boolean;
  buyCost: number;
  nextBuyCost: number;
  numberOfBonds: number;
  nextNumberOfBonds: number;
  nominalValue: number;
  nextNominalValue: number;
  basisOfCapitalisation: number;
  nextBasisOfCapitalisation: number;
  valueAtEndOfMonth: number;
  earlyBuyoutPenalty: number;
  buyoutAtEndOfMonth: number;

  profitAtEndOfMonth: number;
  balanceAtEndOfMonth: number;
  finalValueAtEndOfMath: number;
}

export type TreasuryBondsResult = Record<number, TreasuryBondsMonthlyResult>;
export type TreasuryBondsSimpleResult = Record<number, number>;

export type CalculationParamsByMonthFn = (month: number) => { inflation: number; wibor6m: number; referenceRate: number; savingsRate: number };
export type CalculateByTreasuryBonds = (treasuryBonds: TreasuryBonds, month?: number) => number;
