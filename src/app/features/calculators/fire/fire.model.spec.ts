import { describe, expect, it } from "vitest";
import { calculateFire, FIRE_DEFAULTS, validFireInput } from "./fire.model";

describe("FIRE calculations", () => {
  it("reaches 25 annual budgets in 25 years without growth", () => {
    const result = calculateFire({
      ...FIRE_DEFAULTS,
      capital: 0,
      contribution: 1000,
      expenses: 1000,
      annualReturn: 0,
      inflation: 0,
      withdrawalRate: 4,
    });
    expect(result.target).toBe(300000);
    expect(result.months).toBe(300);
    expect(result.points.at(-1)?.capital).toBe(300000);
  });
  it("recognizes an already funded plan without further contributions", () => {
    const result = calculateFire({
      ...FIRE_DEFAULTS,
      capital: 2000000,
      contribution: 0,
    });
    expect(result.months).toBe(0);
    expect(result.gap).toBe(0);
    expect(result.progress).toBe(100);
    expect(result.points).toHaveLength(1);
  });
  it("reports an unreachable goal for an empty portfolio with no deposits", () => {
    const result = calculateFire({
      ...FIRE_DEFAULTS,
      capital: 0,
      contribution: 0,
    });
    expect(result.months).toBeNull();
    expect(result.points.at(-1)?.month).toBe(1200);
    expect(result.points.at(-1)?.capital).toBe(0);
  });
  it("converts effective annual returns and deposits at the end of each month", () => {
    const result = calculateFire({
      ...FIRE_DEFAULTS,
      capital: 10000,
      contribution: 100,
      annualReturn: 6,
      inflation: 2.5,
    });
    const rate = Math.pow(1.06 / 1.025, 1 / 12) - 1;
    const expected =
      10000 * (1.06 / 1.025) + 100 * ((Math.pow(1 + rate, 12) - 1) / rate);
    expect(result.points[1].capital).toBeCloseTo(expected, 6);
  });
  it("handles zero real return and negative real return", () => {
    const flat = calculateFire({
      ...FIRE_DEFAULTS,
      annualReturn: 5,
      inflation: 5,
    });
    expect(flat.realReturn).toBe(0);
    expect(flat.points[1].capital).toBe(136000);
    const loss = calculateFire({
      ...FIRE_DEFAULTS,
      contribution: 0,
      annualReturn: -20,
      inflation: 20,
    });
    expect(loss.months).toBeNull();
    expect(loss.points[1].capital).toBeCloseTo((100000 * 0.8) / 1.2);
  });
  it("rejects missing, non-finite, out-of-range and fractional age inputs", () => {
    for (const patch of [
      { expenses: 0 },
      { capital: -1 },
      { age: 30.5 },
      { withdrawalRate: 0 },
      { contribution: NaN },
      { annualReturn: Infinity },
    ]) {
      expect(validFireInput({ ...FIRE_DEFAULTS, ...patch })).toBe(false);
      expect(() => calculateFire({ ...FIRE_DEFAULTS, ...patch })).toThrow(
        RangeError,
      );
    }
  });
  it("keeps the largest supported scenario finite", () => {
    const result = calculateFire({
      ...FIRE_DEFAULTS,
      capital: 100000000,
      contribution: 1000000,
      expenses: 1000000,
      withdrawalRate: 0.5,
      annualReturn: 20,
      inflation: 0,
    });
    expect(result.points.every((p) => Number.isFinite(p.capital))).toBe(true);
    expect(result.months).not.toBeNull();
  });
});
