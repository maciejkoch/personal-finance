import type { PortfolioResult } from "@contracts/savings";

export function validateTimeline(result: PortfolioResult, years: number): void {
  const points = result.valueYearPerYear;
  const last = points.at(-1);
  const equalMoney = (a: number, b: number) => Math.abs(a - b) < 0.011;
  if (
    points.length !== years ||
    points.some((p, i) => p.year !== i + 1) ||
    !last ||
    last.compoundedInteres !== result.finalValue ||
    last.totalContribution !== result.totalContribution ||
    !equalMoney(result.netValue, result.finalValue - result.tax) ||
    !equalMoney(
      result.totalDeposited,
      result.initialCapital + result.totalContribution,
    ) ||
    !equalMoney(result.totalInterest, result.finalValue - result.totalDeposited)
  ) {
    throw new Error("Incomplete or inconsistent savings timeline");
  }
}
