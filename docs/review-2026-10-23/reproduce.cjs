// Run from repository root after: npm --prefix functions run build
const { calculate: regular } = require('../../functions/lib/regular-contributions/regular-contributions.service');
const { calculate: savings } = require('../../functions/lib/savings/savings.service');
const { validate } = require('../../functions/lib/regular-contributions/regular-contributions.dto');
const { calculateComparison } = require('../../functions/lib/treasury-bonds/treasury-bonds');

const summary = ({ valueYearPerYear, ...result }) => result;
let cases = 0;
let maxGrossError = 0;
for (const years of [1, 2, 10, 30, 100]) {
  for (const rate of [0, .001, .05, .1]) {
    for (const contribution of [1, 500, 1000]) {
      let balance = 0;
      for (let month = 0; month < years * 12; month++) {
        balance = balance * (1 + rate / 12) + contribution;
      }
      maxGrossError = Math.max(maxGrossError, Math.abs(regular(contribution, years, rate).finalValue - balance));
      cases++;
    }
  }
}
const comparison = calculateComparison({
  numberOfBonds: 100, month: 12, inflation: [.035], referenceRate: [.04],
  savingsRate: [0], wibor6m: [0], skipTax: false, ike: true, familyEligible: false,
});
console.log(JSON.stringify({
  reference: { cases, maxGrossError },
  regularExample: summary(regular(500, 2, .05)),
  savingsExample: summary(savings(10000, 2, .03, .05)),
  nearZeroRate: summary(regular(1000, 1, 1e-16)),
  nearZeroGoal: summary(savings(12000, 1, 0, 1e-16)),
  overflowAccepted: validate({ contribution: '1e308', duration: '100', rate: '1', skipTax: 'false' }).success,
  overflow: summary(regular(1e308, 100, 1)),
  ikeOneYear: comparison.series.map(series => ({ id: series.instrumentId, value: series.points.at(-1).value })),
}, null, 2));
