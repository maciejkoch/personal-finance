import { calculatePortfolio } from "../calculations/portfolio";
import {
  regularContributionResultSchema,
  type RegularContributionResult,
} from "../contracts/savings";

export function calculate(
  contribution: number,
  years: number,
  rate: number,
  skipTax = false,
  initialCapital = 0,
): RegularContributionResult {
  return regularContributionResultSchema.parse({
    contribution,
    ...calculatePortfolio(contribution, years, rate, skipTax, initialCapital),
  });
}
