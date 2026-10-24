export const TAX = 0.19;
const FREQUENCY_OF_COMPOUND = 12;

export function calculatePeriods(years: number): number[] {
  return Array.from({ length: years }, (_, i) => i + 1);
}

/** Future value multiplier for end-of-month payments, continuous at zero. */
export function annuityFactor(years: number, rate: number): number {
  const i = rate / FREQUENCY_OF_COMPOUND;
  const months = years * FREQUENCY_OF_COMPOUND;
  return i === 0 ? months : Math.expm1(months * Math.log1p(i)) / i;
}

export function calculateMonthlyContribution(
  amount: number,
  years: number,
  rate: number,
  tax = TAX,
): number {
  const base = (1 - tax) * annuityFactor(years, rate) + tax * years * 12;
  return Math.max(0, amount) / base;
}

export function calculateCompoundInterest(
  contribution: number,
  years: number,
  rate: number,
): number {
  return contribution * Math.exp(years * 12 * Math.log1p(rate / 12));
}

export function calculateFutureValueOfSeries(
  contribution: number,
  years: number,
  rate: number,
): number {
  return contribution * annuityFactor(years, rate);
}

export function calculateTotalContribution(
  contribution: number,
  years: number,
): number {
  return contribution * years * 12;
}

export function calculateTax(amount: number, tax = TAX): number {
  return Math.max(0, amount) * tax;
}

export function getNOrLastValue(values: number[] = [], n: number): number {
  return values?.[n - 1] ?? values[values.length - 1];
}
