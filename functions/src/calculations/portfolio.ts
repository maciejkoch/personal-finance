import {
  portfolioResultSchema,
  type PortfolioResult,
} from "../contracts/savings";
import {
  calculateCompoundInterest,
  calculateFutureValueOfSeries,
  calculatePeriods,
  calculateTax,
  calculateTotalContribution,
  TAX,
} from "./calculations.service";

export const roundMoney = (value: number): number => +value.toFixed(2);

export function calculatePortfolio(
  contribution: number,
  years: number,
  rate: number,
  skipTax: boolean,
  initialCapital: number,
): PortfolioResult {
  const totalContribution = roundMoney(
    calculateTotalContribution(contribution, years),
  );
  const totalDeposited = roundMoney(initialCapital + totalContribution);
  const valueAt = (year: number) =>
    roundMoney(
      calculateCompoundInterest(initialCapital, year, rate) +
        calculateFutureValueOfSeries(contribution, year, rate),
    );
  const finalValue = valueAt(years);
  const totalInterest = roundMoney(Math.max(0, finalValue - totalDeposited));
  const tax = roundMoney(calculateTax(totalInterest, skipTax ? 0 : TAX));
  return portfolioResultSchema.parse({
    initialCapital,
    totalContribution,
    totalDeposited,
    finalValue,
    totalInterest,
    tax,
    netValue: roundMoney(finalValue - tax),
    valueYearPerYear: calculatePeriods(years).map((year) => ({
      year,
      compoundedInteres: valueAt(year),
      totalContribution: roundMoney(
        calculateTotalContribution(contribution, year),
      ),
    })),
  });
}
