import { deepStrictEqual, strictEqual } from 'assert';
import { calculateCumulativeInflation, calculateFutureValue, calculateFutureValueForMonth } from './inflation.service';

describe('Calculate inflation related values', () => {
  it('should calculate future value', () => {
    strictEqual(calculateFutureValue(100000, 4, 0.05), 121550.62500000003);
    strictEqual(calculateFutureValue(300000, 25, 0.01), 384729.59850517014);
  });

  it('should calculate future value for month', () => {
    const inflation = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12];
    deepStrictEqual(calculateCumulativeInflation(4, inflation), 0.01);
    deepStrictEqual(calculateCumulativeInflation(61, inflation), 0.22825141712000008);
    deepStrictEqual(calculateCumulativeInflation(144, inflation), 1.1157044114866643);
  });

  it('should calculate future value for Month', () => {
    const progressiveInflation = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12];
    strictEqual(calculateFutureValueForMonth(10000, 1, progressiveInflation), 10008.333333333332);
    strictEqual(calculateFutureValueForMonth(10000, 12, progressiveInflation), 10100);
    strictEqual(calculateFutureValueForMonth(10000, 23, progressiveInflation), 10285.166666666666);
    strictEqual(calculateFutureValueForMonth(10000, 144, progressiveInflation), 21157.044114866643);

    const fixedInflation = [0.01];
    strictEqual(calculateFutureValueForMonth(10000, 1, fixedInflation), 10008.333333333332);
    strictEqual(calculateFutureValueForMonth(10000, 144, fixedInflation), 11268.250301319698);
  });
});
