import { z } from "zod";

export const CALCULATOR_LIMITS = {
  capital: 100_000_000,
  contribution: 1_000_000,
  result: 1_000_000_000_000,
} as const;
export const RANGE_ERROR_MESSAGE =
  "Założenia przekraczają zakres kalkulatora: do 1 bln zł wyniku i do 1 mln zł miesięcznej wpłaty, z dokładnością do groszy. Zmień kwoty, okres lub stopy procentowe.";
const money = z.number().finite().min(0).max(CALCULATOR_LIMITS.result);
const point = z.object({
  year: z.number().int().min(1).max(100),
  compoundedInteres: money, // Public spelling preserved for older clients.
  totalContribution: money,
});
export const portfolioResultSchema = z.object({
  initialCapital: money,
  totalContribution: money,
  totalDeposited: money,
  finalValue: money,
  totalInterest: money,
  tax: money,
  netValue: money,
  valueYearPerYear: z.array(point).min(1).max(100),
});
export const regularContributionResultSchema = portfolioResultSchema.extend({
  contribution: money,
});
export const savingsResultSchema = portfolioResultSchema.extend({
  futureValue: money,
  monthlyContribution: z
    .number()
    .finite()
    .min(0)
    .max(CALCULATOR_LIMITS.contribution),
  goalCoveredByInitialCapital: z.boolean(),
});
export type PortfolioResult = z.infer<typeof portfolioResultSchema>;
export type RegularContributionResult = z.infer<
  typeof regularContributionResultSchema
>;
export type SavingsResult = z.infer<typeof savingsResultSchema>;
