export type RegularContributionRequest = {
  contribution: number;
  duration: number;
  rate: number;
  skipRate: boolean;
  skipTax: boolean;
};

export type RegularContributionData = RegularContributionRequest & {
  finalValue: number;
  tax: number;
  totalContribution: number;
  totalInterest: number;
  valueYearPerYear: {
    compoundedInteres: number;
    totalContribution: number;
    year: number;
  }[];
};
