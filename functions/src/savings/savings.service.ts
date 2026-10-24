import {
  calculateCompoundInterest,
  calculateMonthlyContribution,
  calculateTax,
  TAX,
} from "../calculations/calculations.service";
import { calculateFutureValue } from "../calculations/inflation.service";
import { calculatePortfolio, roundMoney } from "../calculations/portfolio";
import {
  savingsResultSchema,
  CALCULATOR_LIMITS,
  type SavingsResult,
} from "../contracts/savings";

export function calculate(
  amount: number,
  years: number,
  inflation: number,
  rate: number,
  skipTax = false,
  initialCapital = 0,
): SavingsResult {
  const tax = skipTax ? 0 : TAX;
  const futureValue = roundMoney(
    calculateFutureValue(amount, years, inflation),
  );
  // Check the target before trying to solve the annuity (Infinity is not a target).
  if (!Number.isFinite(futureValue) || futureValue > CALCULATOR_LIMITS.result)
    throw new RangeError("Goal out of range");
  const initialGross = calculateCompoundInterest(initialCapital, years, rate);
  const initialNet =
    initialGross - calculateTax(initialGross - initialCapital, tax);
  const goalCoveredByInitialCapital = initialNet >= futureValue;
  const monthlyContribution = roundMoney(
    calculateMonthlyContribution(
      Math.max(0, futureValue - initialNet),
      years,
      rate,
      tax,
    ),
  );
  if (monthlyContribution === 0 && !goalCoveredByInitialCapital)
    throw new RangeError("Payment below cent precision");
  return savingsResultSchema.parse({
    ...calculatePortfolio(
      monthlyContribution,
      years,
      rate,
      skipTax,
      initialCapital,
    ),
    futureValue,
    monthlyContribution,
    goalCoveredByInitialCapital,
  });
}
