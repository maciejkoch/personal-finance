import { strictEqual, deepStrictEqual } from 'assert';
import { calculateMonthlyContribution, calculatePeriods, calculateCompoundInterest, calculateFutureValueOfSeries, calculateTax } from './calculations.service';

describe('Calculate', () => {
  it('should calculate monthly contribution', () => {
    strictEqual(calculateMonthlyContribution(384729.6, 25, 0.01), 1155.5427156865303);
    strictEqual(calculateMonthlyContribution(10000, 10, 0), 83.33333333333333);
    strictEqual(calculateMonthlyContribution(1000000000, 30, 0.99), 0.0000411076945192325);
    strictEqual(calculateMonthlyContribution(100000, 12, 0.01, 0), 653.8998760807384);
  });

  it('should calculate periods', () => {
    deepStrictEqual(calculatePeriods(1), [1]);
    deepStrictEqual(calculatePeriods(9), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('should calculate tax', () => {
    deepStrictEqual(calculateTax(1000), 190);
    deepStrictEqual(calculateTax(1000, 0), 0);
  });

  it('should calculate combound interes', () => {
    deepStrictEqual(calculateCompoundInterest(2500, 10, 0.05), 4117.5237442257);
    deepStrictEqual(calculateCompoundInterest(1000, 16, 0.1), 4920.303130130615);
    deepStrictEqual(calculateCompoundInterest(1000, 5, 0), 1000);
    deepStrictEqual(calculateCompoundInterest(1000, 30, 0.99), 2477683388543099.5);
  });

  it('should future value of series', () => {
    deepStrictEqual(calculateFutureValueOfSeries(100, 10, 0.05), 15528.227944566726);
    deepStrictEqual(calculateFutureValueOfSeries(1000, 30, 0.07), 1219970.9957759448);
    deepStrictEqual(calculateFutureValueOfSeries(1155.54, 25, 0.01), 393657.92077998363);
    deepStrictEqual(calculateFutureValueOfSeries(500, 10, 0), 60000);

    deepStrictEqual(calculateFutureValueOfSeries(1000, 30, 0.99), 30032525921722416);
  });
});
