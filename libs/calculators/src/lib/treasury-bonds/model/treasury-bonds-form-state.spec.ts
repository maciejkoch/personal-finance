import {
  bondFormDefaults,
  readBondForm,
  serializeBondForm,
} from "./treasury-bonds-form-state";

describe("Bond assumptions persistence", () => {
  it("keeps legacy user assumptions when upgrading the offer", () => {
    const values = {
      numberOfBonds: 250,
      duration: 8,
      inflation: 8,
      referenceRate: 6.25,
      rate: 2,
      skipTax: true,
    };
    expect(readBondForm(JSON.stringify({ ...values, wibor6m: 5.84 }))).toEqual(
      values,
    );
    expect(
      readBondForm(
        JSON.stringify({ schemaVersion: 2, offerVersion: "older", values }),
      ),
    ).toEqual(values);
  });
  it("repairs invalid fields independently and preserves valid ones", () => {
    expect(
      readBondForm(
        JSON.stringify({
          ...bondFormDefaults,
          duration: 144,
          numberOfBonds: 1.5,
          inflation: -2,
          referenceRate: 6,
        }),
      ),
    ).toEqual({ ...bondFormDefaults, inflation: -2, referenceRate: 6 });
  });
  it("falls back safely for corrupt and future storage formats", () => {
    for (const value of [
      null,
      "bad json",
      "[]",
      "null",
      '{"schemaVersion":3}',
      '{"schemaVersion":2,"values":null}',
    ]) {
      expect(readBondForm(value)).toEqual(bondFormDefaults);
    }
  });
  it("writes a versioned envelope and round-trips deflation and zero rates", () => {
    const values = { ...bondFormDefaults, inflation: -1, referenceRate: 0 };
    const saved = serializeBondForm(values);
    expect(JSON.parse(saved)).toMatchObject({
      schemaVersion: 2,
      offerVersion: "2026-10-v1",
    });
    expect(readBondForm(saved)).toEqual(values);
  });
});
