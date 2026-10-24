import {
  bondFormDefaults,
  readBondForm,
  serializeBondForm,
} from "./treasury-bonds-form-state";

describe("Current bond assumptions persistence", () => {
  it("round-trips the current format", () => {
    const values = {
      ...bondFormDefaults,
      inflation: -1,
      familyEligible: true,
      skipTax: true,
    };
    expect(readBondForm(serializeBondForm(values))).toEqual(values);
  });
  it("resets all assumptions for old, corrupt or invalid formats", () => {
    for (const value of [
      null,
      "bad json",
      "[]",
      "null",
      JSON.stringify(bondFormDefaults),
      JSON.stringify({ schemaVersion: 3, values: bondFormDefaults }),
      JSON.stringify({
        schemaVersion: 4,
        values: { ...bondFormDefaults, duration: 100 },
      }),
    ]) {
      expect(readBondForm(value)).toEqual(bondFormDefaults);
    }
  });
});
