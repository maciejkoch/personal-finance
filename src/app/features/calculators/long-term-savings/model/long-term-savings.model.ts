export type LongTermSavingsRequest = {
  amount: number;
  duration: number;
  inflation: number;
  rate: number;
  skipInflation: boolean;
  skipRate: boolean;
  skipTax: boolean;
};

export type LongTermSavingsData = LongTermSavingsRequest & {
  finalValue: number;
  futureValue: number;
  monthlyContribution: number;
  tax: number;
  totalContribution: number;
  totalInterest: number;
  valueYearPerYear: {
    compoundedInteres: number;
    totalContribution: number;
    year: number;
  }[];
};
