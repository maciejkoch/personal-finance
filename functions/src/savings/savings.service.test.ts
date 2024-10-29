import { deepStrictEqual } from 'assert';
import { calculate } from './savings.service';

describe('Calculate savings', () => {
  it('should calculate savings', () => {
    deepStrictEqual(calculate(300000, 5, 0.03, 0.05), {
      futureValue: 347782.22,
      monthlyContribution: 5230.99,
      totalContribution: 313859.4,
      finalValue: 355739.14,
      tax: 7957.15,
      totalInterest: 41879.74,
      valueYearPerYear: [
        {
          compoundedInteres: 64230.57,
          totalContribution: 62771.88,
          year: 1,
        },
        {
          compoundedInteres: 131747.3,
          totalContribution: 125543.76,
          year: 2,
        },
        {
          compoundedInteres: 202718.31,
          totalContribution: 188315.64,
          year: 3,
        },
        {
          compoundedInteres: 277320.33,
          totalContribution: 251087.52,
          year: 4,
        },
        {
          compoundedInteres: 355739.14,
          totalContribution: 313859.4,
          year: 5,
        },
      ],
    });

    deepStrictEqual(calculate(4000, 2, 0.11, 0.02), {
      finalValue: 4946.22,
      futureValue: 4928.4,
      monthlyContribution: 202.17,
      tax: 17.89,
      totalContribution: 4852.08,
      totalInterest: 94.14,
      valueYearPerYear: [
        {
          compoundedInteres: 2448.4,
          totalContribution: 2426.04,
          year: 1,
        },
        {
          compoundedInteres: 4946.22,
          totalContribution: 4852.08,
          year: 2,
        },
      ],
    });
  });
});
