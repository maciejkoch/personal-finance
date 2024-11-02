import { calculateFutureValueOfSeries, calculatePeriods, calculateTax, calculateTotalContribution, TAX } from '../calculations/calculations.service';

export function calculate(contribution: number, years: number, rate: number, skipTax = false): unknown {
  const tax = skipTax ? 0 : TAX;
  const periods = calculatePeriods(years);

  const totalContribution = +calculateTotalContribution(contribution, years).toFixed(2);
  const finalValue = +calculateFutureValueOfSeries(contribution, years, rate).toFixed(2);
  const totalInterest = +(finalValue - totalContribution).toFixed(2);
  const finalTax = +calculateTax(totalInterest, tax).toFixed(2);
  const valueYearPerYear = periods.map((year) => ({
    year,
    compoundedInteres: +calculateFutureValueOfSeries(contribution, year, rate).toFixed(2),
    totalContribution: +calculateTotalContribution(contribution, year).toFixed(2),
  }));

  return {
    contribution,
    totalContribution,
    finalValue,
    totalInterest,
    tax: finalTax,
    valueYearPerYear,
  };
}
