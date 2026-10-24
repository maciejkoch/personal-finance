import type { RegularContributionResult } from "@contracts/savings";
export type RegularContributionRequest = {
  contribution: number;
  initialCapital?: number;
  duration: number;
  rate: number;
  skipRate: boolean;
  skipTax: boolean;
};

export type RegularContributionData = RegularContributionRequest &
  RegularContributionResult;
