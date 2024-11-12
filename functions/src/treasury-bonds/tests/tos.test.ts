// import { deepStrictEqual } from 'assert';

// import { TOS } from '../treasury-bonds.consts';
// import {
//   CalculationParams,
//   TreasuryBondsMonthlyResult,
// } from '../treasury-bonds.model';
// import { calculate } from '../treasury-bonds.service';

// xdescribe('Calculate treasury bonds', () => {
//   it('should work for TOS with 1000 bonds and progressive params', () => {
//     const calculationParams: CalculationParams = {
//       inflation: [
//         0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12,
//       ],
//       referenceRate: [
//         0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12,
//       ],
//       wibor6m: [
//         0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12,
//       ],
//       savingsRate: [
//         0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12,
//       ],
//     };
//     const result = calculate(TOS, 1000, 144, calculationParams);
//     const expectedResult144: Partial<TreasuryBondsMonthlyResult> = {
//       finalValueAtEndOfMath: 177517.36,
//     };
//     deepStrictEqual(result[144], { ...result[144], ...expectedResult144 });
//   });
// });
