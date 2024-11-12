import { deepStrictEqual } from 'assert';

import {
  CalculationParams,
  TreasuryBondsMonthlyResult,
} from '../treasury-bonds.model';
import { calculate } from './ros.service';

describe('Calculate treasury bonds', () => {
  it('should work for ROS with 1000 bonds and progressive params', () => {
    const calculationParams: CalculationParams = {
      inflation: [
        0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12,
      ],
      referenceRate: [
        0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12,
      ],
      wibor6m: [
        0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12,
      ],
      savingsRate: [
        0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12,
      ],
    };
    const result = calculate(1000, 144, calculationParams);

    const expectedResult144: Partial<TreasuryBondsMonthlyResult> = {
      numberOfBonds: 1291, // u Iwuca 1290, prawdopodobnie inaczej liczy liczbe obligacji (nie dodaje salda na koniec miesiaca / cene obligacji)
      finalValueAtEndOfMath: 212237.55, // u Iwuca 212027.14,
    };
    deepStrictEqual(result[144], { ...result[144], ...expectedResult144 });
  });
});
