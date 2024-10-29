import { calculateFutureValueOfSeries, calculateMonthlyContribution, calculatePeriods, calculateTax, calculateTotalContribution, TAX } from '../calculations/calculations.service';
import { calculateFutureValue } from '../calculations/inflation.service';

export function calculate(amount: number, years: number, inflation: number, rate: number, skipTax = false): unknown {
  const tax = skipTax ? 0 : TAX;
  const periods = calculatePeriods(years);

  const futureValue = +calculateFutureValue(amount, years, inflation).toFixed(2);
  const monthlyContribution = +calculateMonthlyContribution(futureValue, years, rate, tax).toFixed(2);
  const totalContribution = +calculateTotalContribution(monthlyContribution, years).toFixed(2);
  const finalValue = +calculateFutureValueOfSeries(monthlyContribution, years, rate).toFixed(2);
  const totalInterest = +(finalValue - totalContribution).toFixed(2);
  const finalTax = +calculateTax(totalInterest, tax).toFixed(2);
  const valueYearPerYear = periods.map((year) => ({
    year,
    compoundedInteres: +calculateFutureValueOfSeries(monthlyContribution, year, rate).toFixed(2),
    totalContribution: +calculateTotalContribution(monthlyContribution, year).toFixed(2),
  }));

  return {
    futureValue,
    monthlyContribution,
    totalContribution,
    finalValue,
    totalInterest,
    tax: finalTax,
    valueYearPerYear,
  };
}
