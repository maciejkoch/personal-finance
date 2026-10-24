export interface TreasuryBondsRequest {
  numberOfBonds: number;
  month: number;
  inflation: number[];
  wibor6m: number[];
  referenceRate: number[];
  savingsRate: number[];
  skipTax: boolean;
  familyEligible?: boolean;
}

export interface TreasuryBondsRecord {
  month: number;

  ror: number;
  dor: number;
  coi: number;
  tos: number;
  edo: number;
  ros?: number;
  rod?: number;

  futureValue: number;
}

export interface TreasuryBondsResult extends TreasuryBondsRequest {
  values: TreasuryBondsRecord[];
  offerVersion: string;
  calculationVersion: number;
  activeBondTypes?: import("@markets/pl/polish-calculator-options").PolishBondType[];
}
