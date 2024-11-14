export interface TreasuryBondsRequest {
  numberOfBonds: number;
  month: number;
  inflation: number[];
  wibor6m: number[];
  referenceRate: number[];
  savingsRate: number[];
}

export interface TreasuryBondsRecord {
  month: number;

  ror: TreasuryBondsValue;
  dor: TreasuryBondsValue;
  coi: TreasuryBondsValue;
  tos: TreasuryBondsValue;
  edo: TreasuryBondsValue;
  ros: TreasuryBondsValue;
  rod: TreasuryBondsValue;

  futureValue: number;
}

export interface TreasuryBondsResult extends TreasuryBondsRequest {
  values: TreasuryBondsRecord[];
}

export interface TreasuryBondsValue {
  finalValueAtEndOfMath: number;
}
