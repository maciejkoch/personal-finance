import { vi } from "vitest";
import { z } from "zod";
import { useLocalStorage } from "./use-local-storage";

describe("Local storage after Zod 4 migration", () => {
  const schema = z.object({ amount: z.number(), skipTax: z.boolean() });
  const storage = useLocalStorage("stage9-settings", schema);

  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("reads the existing unversioned format and strips obsolete fields", () => {
    localStorage.setItem(
      "stage9-settings",
      JSON.stringify({ amount: 1234.56, skipTax: true, old: 1 }),
    );
    expect(storage.load()).toEqual({ amount: 1234.56, skipTax: true });
    storage.save({ amount: 42, skipTax: false });
    expect(JSON.parse(localStorage.getItem("stage9-settings")!)).toEqual({
      amount: 42,
      skipTax: false,
    });
  });

  it("rejects corrupt JSON, missing fields and changed types without overwriting the original", () => {
    for (const saved of [
      "bad json",
      "null",
      "[]",
      '{"amount":1}',
      '{"amount":"1","skipTax":false}',
    ]) {
      localStorage.setItem("stage9-settings", saved);
      expect(storage.load()).toBeNull();
      expect(localStorage.getItem("stage9-settings")).toBe(saved);
    }
  });

  it("preserves the legacy boolean color preference including false", () => {
    const preference = useLocalStorage(
      "treasury-bonds-use-colors",
      z.boolean(),
    );
    for (const value of [false, true]) {
      localStorage.setItem("treasury-bonds-use-colors", JSON.stringify(value));
      expect(preference.load()).toBe(value);
    }
  });

  it("works when storage is unavailable during server rendering", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(storage.load()).toBeNull();
    expect(() => storage.save({ amount: 1, skipTax: false })).not.toThrow();
  });

  it("handles browser access denial and storage quota errors", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    expect(storage.load()).toBeNull();
    expect(() => storage.save({ amount: 1, skipTax: false })).not.toThrow();
  });
});
