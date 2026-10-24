import { strictEqual, ok, throws } from "node:assert";
import { calculate as regular } from "../regular-contributions/regular-contributions.service";
import { calculate as savings } from "../savings/savings.service";
import { validate } from "../regular-contributions/regular-contributions.dto";
import { validateSavings } from "../savings/savings.dto";
import { calculateTax } from "./calculations.service";

describe("Initial capital, numerical stability and supported range", () => {
  it("matches independently accumulated monthly cash flows including starting capital", () => {
    for (const initial of [0, 1000, 100000])
      for (const contribution of [0, 500])
        for (const rate of [0, 1e-16, 1e-14, 0.05, 0.12])
          for (const years of [1, 4, 20]) {
            let balance = initial;
            for (let m = 0; m < years * 12; m++)
              balance = balance * (1 + rate / 12) + contribution;
            const result = regular(contribution, years, rate, false, initial);
            ok(
              Math.abs(result.finalValue - balance) < 0.011,
              JSON.stringify({ initial, contribution, rate, years }),
            );
            strictEqual(
              result.totalDeposited,
              initial + contribution * years * 12,
            );
            strictEqual(
              result.valueYearPerYear.at(-1)!.compoundedInteres,
              result.finalValue,
            );
            ok(result.totalInterest >= 0 && result.tax >= 0);
          }
  });
  it("does not tax the original capital and supports zero later payments", () => {
    const result = regular(0, 1, 0.12, false, 10000);
    // 10000 * 1.01^12 = 11268.250301; tax is 19% of the gain only.
    strictEqual(result.finalValue, 11268.25);
    strictEqual(result.tax, 240.97);
    strictEqual(result.netValue, 11027.28);
    strictEqual(regular(0, 1, 0.12, true, 10000).tax, 0);
  });
  it("solves the remaining goal after starting capital and never requests negative payments", () => {
    strictEqual(savings(12000, 1, 0, 0, false, 6000).monthlyContribution, 500);
    const covered = savings(10000, 1, 0, 0.12, false, 10000);
    strictEqual(covered.monthlyContribution, 0);
    strictEqual(covered.goalCoveredByInitialCapital, true);
    strictEqual(covered.netValue, 11027.28);
    strictEqual(savings(12000, 1, 0, 1e-16).monthlyContribution, 1000);
    strictEqual(regular(1000, 1, 1e-16).netValue, 12000);
    strictEqual(calculateTax(-1000), 0);
  });
  it("enforces limits and rejects non-finite values before JSON serialization", () => {
    const query = {
      contribution: "0",
      initialCapital: "10000",
      duration: "1",
      rate: "0",
    };
    ok(validate(query).success);
    strictEqual(validate({ ...query, initialCapital: "0" }).success, false);
    for (const value of ["1e308", "100000001", "Infinity", "NaN", "-1"]) {
      strictEqual(validate({ ...query, initialCapital: value }).success, false);
    }
    strictEqual(validate({ ...query, contribution: "1000001" }).success, false);
    strictEqual(
      validateSavings({
        amount: "100000001",
        duration: "1",
        rate: "0",
        inflation: "0",
      }).success,
      false,
    );
    throws(() => regular(1000000, 100, 1, false, 100000000));
    throws(() => savings(100000000, 100, 1, 0.05));
    strictEqual(regular(1000000, 1, 0, false, 100000000).netValue, 112000000);
  });
});
