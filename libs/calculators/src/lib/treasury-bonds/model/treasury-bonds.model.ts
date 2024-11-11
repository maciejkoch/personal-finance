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

  ror: number;
  dor: number;
  coi: number;
  toz: number;
  edo: number;
  ros: number;
  rod: number;

  futureValue: number;
}

export interface TreasuryBondsResult extends TreasuryBondsRequest {
  values: TreasuryBondsRecord[];
}
