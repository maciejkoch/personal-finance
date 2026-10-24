import type { SavingsResult } from "@contracts/savings";
export type LongTermSavingsRequest = {
  amount: number;
  initialCapital?: number;
  duration: number;
  inflation: number;
  rate: number;
  skipInflation: boolean;
  skipRate: boolean;
  skipTax: boolean;
};

export type LongTermSavingsData = LongTermSavingsRequest & SavingsResult;
