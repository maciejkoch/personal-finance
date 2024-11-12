import { deepStrictEqual } from 'assert';

import { CalculationParams } from './treasury-bonds.model';
import { createCalculationParamsByMonthFn } from './treasury-bonds.service';

describe('Treasury bonds params', () => {
  it('should return proper values for given month', () => {
    const params: CalculationParams = {
      inflation: [1],
      referenceRate: [1, 2],
      savingsRate: [1, 2, 3],
      wibor6m: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    };

    const expected = {
      inflation: 1,
      referenceRate: 2,
      savingsRate: 3,
      wibor6m: 4,
    };
    const fn = createCalculationParamsByMonthFn(params);
    deepStrictEqual(fn(37), expected);
  });
});
