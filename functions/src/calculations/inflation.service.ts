import { getNOrLastValue } from './calculations.service';

export function calculateFutureValue(amount: number, years: number, inflation: number): number {
  const result = amount * Math.pow(1 + inflation, years);
  return result;
}

export function calculateFutureValueForMonth(amount: number, month: number, inflation: number[]): number {
  const year = Math.ceil(month / 12);
  const fullYear = Math.floor(month / 12);
  const cumaltiveInflationForFullYear = fullYear ? calculateCumulativeInflation(fullYear * 12, inflation) : 0;
  const inflationForMonth = 1 + ((month % 12) * getNOrLastValue(inflation, year)) / 12;
  return amount * (1 + cumaltiveInflationForFullYear) * inflationForMonth;
}

export function calculateCumulativeInflation(month: number, inflation: number[]): number {
  const calc: (year: number) => number = (year) => {
    const currentInflation = getNOrLastValue(inflation, year);
    return year === 1 ? currentInflation : (1 + calc(year - 1)) * (1 + currentInflation) - 1;
  };

  const currentYear = Math.ceil(month / 12);
  return calc(currentYear);
}

export function calculateFutureValueForMonths(amount: number, month: number, inflation: number[]): Record<number, number> {
  const months = [...Array(month).keys()].map((i) => i + 1);

  return months.reduce<Record<number, number>>(
    (acc, month) => ({
      ...acc,
      [month]: +calculateFutureValueForMonth(amount, month, inflation).toFixed(2),
    }),
    {},
  );
}
