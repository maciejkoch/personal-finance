import { deepStrictEqual } from 'assert';
import { calculate } from './regular-contributions.service';

describe('Calculate regular contributions', () => {
  it('should calculate', () => {
    deepStrictEqual(calculate(300000, 5, 0.03), {
      contribution: 300000,
      finalValue: 19394013.79,
      tax: 264862.62,
      totalContribution: 18000000,
      totalInterest: 1394013.79,
      valueYearPerYear: [
        {
          compoundedInteres: 3649914.83,
          totalContribution: 3600000,
          year: 1,
        },
        {
          compoundedInteres: 7410845.31,
          totalContribution: 7200000,
          year: 2,
        },
        {
          compoundedInteres: 11286168.09,
          totalContribution: 10800000,
          year: 3,
        },
        {
          compoundedInteres: 15279362.52,
          totalContribution: 14400000,
          year: 4,
        },
        {
          compoundedInteres: 19394013.79,
          totalContribution: 18000000,
          year: 5,
        },
      ],
    });

    deepStrictEqual(calculate(4000, 2, 0.11, true), {
      contribution: 4000,
      finalValue: 106834.26,
      tax: 0,
      totalContribution: 96000,
      totalInterest: 10834.26,
      valueYearPerYear: [
        {
          compoundedInteres: 50495.49,
          totalContribution: 48000,
          year: 1,
        },
        {
          compoundedInteres: 106834.26,
          totalContribution: 96000,
          year: 2,
        },
      ],
    });
  });
});
