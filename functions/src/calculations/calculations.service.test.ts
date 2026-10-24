import { deepStrictEqual, ok } from "assert";
const approximately = (actual: number, expected: number) =>
  ok(
    Math.abs(actual - expected) <= Math.max(1e-9, Math.abs(expected) * 1e-12),
    `${actual} differs from ${expected}`,
  );
import {
  calculateMonthlyContribution,
  calculatePeriods,
  calculateCompoundInterest,
  calculateFutureValueOfSeries,
  calculateTax,
} from "./calculations.service";

describe("Calculate", () => {
  it("should calculate monthly contribution", () => {
    approximately(
      calculateMonthlyContribution(384729.6, 25, 0.01),
      1155.5427156865303,
    );
    approximately(
      calculateMonthlyContribution(10000, 10, 0),
      83.33333333333333,
    );
    approximately(
      calculateMonthlyContribution(1000000000, 30, 0.99),
      0.0000411076945192325,
    );
    approximately(
      calculateMonthlyContribution(100000, 12, 0.01, 0),
      653.8998760807384,
    );
  });

  it("should calculate periods", () => {
    deepStrictEqual(calculatePeriods(1), [1]);
    deepStrictEqual(calculatePeriods(9), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("should calculate tax", () => {
    deepStrictEqual(calculateTax(1000), 190);
    deepStrictEqual(calculateTax(1000, 0), 0);
  });

  it("should calculate combound interes", () => {
    approximately(calculateCompoundInterest(2500, 10, 0.05), 4117.5237442257);
    approximately(calculateCompoundInterest(1000, 16, 0.1), 4920.303130130615);
    approximately(calculateCompoundInterest(1000, 5, 0), 1000);
    approximately(
      calculateCompoundInterest(1000, 30, 0.99),
      2477683388543099.5,
    );
  });

  it("should future value of series", () => {
    approximately(
      calculateFutureValueOfSeries(100, 10, 0.05),
      15528.227944566726,
    );
    approximately(
      calculateFutureValueOfSeries(1000, 30, 0.07),
      1219970.9957759448,
    );
    approximately(
      calculateFutureValueOfSeries(1155.54, 25, 0.01),
      393657.92077998363,
    );
    approximately(calculateFutureValueOfSeries(500, 10, 0), 60000);

    approximately(
      calculateFutureValueOfSeries(1000, 30, 0.99),
      30032525921722416,
    );
  });
});
