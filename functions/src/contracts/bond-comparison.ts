/** Transport-only contract; no market rules, framework or runtime dependencies. */
export interface BondPoint {
  month: number;
  value: number;
}

export interface BondSeries {
  instrumentId: string;
  currency: string;
  points: BondPoint[];
}

export interface BondComparisonResponse {
  contractVersion: 3 | 4;
  offerId?: string;
  calculationVersion: number;
  offerVersion: string;
  marketId: string;
  skipTax: boolean;
  series: BondSeries[];
  benchmark: BondPoint[];
}
