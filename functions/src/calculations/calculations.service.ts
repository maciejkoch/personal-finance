export const TAX = 0.19;
const FREQUENCY_OF_COMPOUND = 12; // przeliczenie co miesiac

export function calculatePeriods(years: number): number[] {
  return [...Array(years).keys()].map((value) => value + 1);
}

export function calculateMonthlyContribution(amount: number, years: number, rate: number, tax = TAX): number {
  const F = FREQUENCY_OF_COMPOUND;

  const monthlyRate = rate ? rate / F : 0;
  const months = years * 12;
  const base = monthlyRate ? ((1 - tax) * (Math.pow(1 + monthlyRate, months) - 1)) / monthlyRate + tax * months : months;
  const result = amount / base;

  return result;
}

export function calculateCompoundInterest(contribution: number, years: number, rate: number): number {
  const F = FREQUENCY_OF_COMPOUND;

  const result = contribution * Math.pow(1 + rate / F, years * F);
  return result;
}

export function calculateFutureValueOfSeries(contribution: number, years: number, rate: number): number {
  const F = FREQUENCY_OF_COMPOUND;

  const calculateWithoutRate = () => contribution * years * 12;
  const calculate = () => (contribution * (Math.pow(1 + rate / F, F * years) - 1)) / (rate / F); //* (1 + rate / F); ostatnie mnozenie jesli dodatkowe wplaty sa na poczatku okresu

  const result = rate ? calculate() : calculateWithoutRate();
  return result;
}

export function calculateTotalContribution(contribution: number, years: number): number {
  const months = years * 12;
  const result = contribution * months;
  return result;
}

export function calculateTax(amount: number, tax = TAX) {
  const result = amount * tax;
  return result;
}

export function getNOrLastValue(values: number[] = [], n: number): number {
  return values?.[n - 1] || values[values.length - 1];
}
