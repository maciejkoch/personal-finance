import { deepStrictEqual, ok, strictEqual } from "node:assert";
import reference from "./regression-reference.json";
import { calculate as calculateContribution } from "../regular-contributions/regular-contributions.service";
import { calculate as calculateSavings } from "../savings/savings.service";
import { calculate as calculateBonds } from "../treasury-bonds/treasury-bonds";
import { simulateBond } from "../treasury-bonds/bond-simulation";
import { TREASURY_BONDS_OFFER } from "../treasury-bonds/treasury-bonds.consts";

describe("Independent calculator regression references", () => {
  it("requires an explicit review when the issue offer changes", () => {
    strictEqual(
      TREASURY_BONDS_OFFER.version,
      reference.offerVersion,
      "Review the issue letters and analytical references; do not regenerate expectations from production output.",
    );
  });

  for (const testCase of reference.bonds) {
    it(testCase.name, () => {
      const bond =
        TREASURY_BONDS_OFFER.bonds[
          testCase.bond as keyof typeof TREASURY_BONDS_OFFER.bonds
        ];
      const params = {
        inflation: testCase.inflation,
        referenceRate: testCase.referenceRate,
        savingsRate: testCase.savingsRate,
        wibor6m: [0],
        skipTax: testCase.skipTax,
      };
      const point = simulateBond(
        bond,
        testCase.quantity,
        testCase.month,
        params,
      )[testCase.month];
      for (const [field, expected] of Object.entries(testCase.expected)) {
        strictEqual(
          point[field as keyof typeof point],
          expected,
          `${testCase.name}: ${field}; ${testCase.derivation}`,
        );
      }
      // The same independently checked amount must reach the public result;
      // catching wrapper mixups is separate from checking the simulator.
      const result = calculateBonds({
        ...params,
        numberOfBonds: testCase.quantity,
        month: testCase.month,
      });
      const last = result.values.at(-1)!;
      strictEqual(
        last[
          testCase.bond.toLowerCase() as keyof Omit<
            typeof last,
            "month" | "futureValue"
          >
        ],
        testCase.expected.finalValueAtEndOfMath,
      );
    });
  }

  for (const testCase of reference.regularContributions) {
    it(`regular contributions: ${testCase.name}`, () => {
      const { contribution, duration, rate, skipTax } = testCase.input;
      const result = calculateContribution(
        contribution,
        duration,
        rate,
        skipTax,
      ) as Record<string, unknown>;
      for (const [field, expected] of Object.entries(testCase.expected))
        strictEqual(result[field], expected, field);
      const yearly = result["valueYearPerYear"] as {
        year: number;
        compoundedInteres: number;
        totalContribution: number;
      }[];
      deepStrictEqual(
        yearly.map((point) => point.year),
        Array.from({ length: duration }, (_, i) => i + 1),
      );
      strictEqual(yearly.at(-1)!.compoundedInteres, result["finalValue"]);
      strictEqual(
        yearly.at(-1)!.totalContribution,
        result["totalContribution"],
      );
    });
  }

  for (const testCase of reference.savings) {
    it(`savings goal: ${testCase.name}`, () => {
      const { amount, duration, inflation, rate, skipTax } = testCase.input;
      const result = calculateSavings(
        amount,
        duration,
        inflation,
        rate,
        skipTax,
      ) as Record<string, unknown>;
      for (const [field, expected] of Object.entries(testCase.expected))
        strictEqual(result[field], expected, field);
      const yearly = result["valueYearPerYear"] as {
        year: number;
        compoundedInteres: number;
        totalContribution: number;
      }[];
      strictEqual(yearly.length, duration);
      strictEqual(yearly.at(-1)!.compoundedInteres, result["finalValue"]);
      strictEqual(
        yearly.at(-1)!.totalContribution,
        result["totalContribution"],
      );
      ok(yearly.every((point) => Number.isFinite(point.compoundedInteres)));
    });
  }

  it("skipping tax preserves gross growth but reduces the required contribution for a growing goal", () => {
    const taxed = calculateContribution(1000, 15, 0.05, false) as Record<
      string,
      unknown
    >;
    const taxFree = calculateContribution(1000, 15, 0.05, true) as Record<
      string,
      unknown
    >;
    strictEqual(taxed["finalValue"], taxFree["finalValue"]);
    deepStrictEqual(taxed["valueYearPerYear"], taxFree["valueYearPerYear"]);
    strictEqual(taxFree["tax"], 0);
    const goal = calculateSavings(150000, 15, 0.035, 0.05, false) as {
      monthlyContribution: number;
    };
    const taxFreeGoal = calculateSavings(150000, 15, 0.035, 0.05, true) as {
      monthlyContribution: number;
    };
    ok(taxFreeGoal.monthlyContribution < goal.monthlyContribution);
  });
});
