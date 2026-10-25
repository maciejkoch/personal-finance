import {
  deepStrictEqual,
  strictEqual,
  throws,
  notStrictEqual,
} from "node:assert";
import baseline from "../treasury-bonds/treasury-bonds.offer.json";
import septemberTexts from "./fixtures/letters-2026-09.json";
import texts from "./fixtures/letters-2026-10.json";
import { bondTypes, offerSchema } from "../contracts/bond-offer";
import { discoverSeries, findPdf, parseLetters } from "./parser";
import { offerId, selectCurrent, warsawDate } from "./repository";
import { calculateComparison } from "../treasury-bonds/treasury-bonds";
import { validate } from "../treasury-bonds/treasury-bonds.dto";
import { simulateBond } from "../treasury-bonds/bond-simulation";

const letters = () =>
  bondTypes.map((type) => ({
    type,
    text: texts[type],
    url: baseline.bonds[type].source,
    sha256: "fixture",
  }));
describe("Versioned bond offers", () => {
  it("extracts the independently verified October terms from all seven legal documents", () => {
    const parsed = parseLetters(letters(), baseline.verifiedAt);
    deepStrictEqual(parsed.bonds, baseline.bonds);
    strictEqual(parsed.saleFrom, "2026-10-01");
    strictEqual(parsed.saleTo, "2026-10-31");
  });
  it("recognizes a second real month without reusing October dates or series", () => {
    const input = letters().map((letter) => ({
      ...letter,
      text: septemberTexts[letter.type],
    }));
    const offer = parseLetters(input, "2026-10-24");
    strictEqual(offer.month, "2026-09");
    strictEqual(offer.saleTo, "2026-09-30");
    strictEqual(offer.bonds.EDO.series, "EDO0936");
  });
  it("accepts rate changes, but rejects unrecognized legal or formula changes", () => {
    const changed = letters();
    changed[0].text = changed[0].text.replace("wynosi 4,00%", "wynosi 4,25%");
    strictEqual(
      parseLetters(changed, "2026-10-24").bonds.ROR.firstPeriodRate,
      0.0425,
    );
    changed[0].text = changed[0].text.replace("siedmiu dni", "ośmiu dni");
    throws(() => parseLetters(changed, "2026-10-24"), /Unsupported legal/);
    const formula = letters();
    formula[4].text += " Nowa zasada kapitalizacji.";
    throws(() => parseLetters(formula, "2026-10-24"), /Unsupported legal/);
  });
  it("extracts changed fees and exchange prices, and rejects inconsistent TOS amounts", () => {
    const changed = letters().map(letter => ({ ...letter, text: letter.text.replace(/\s+/g, " ") }));
    changed[0].text = changed[0].text
      .replaceAll(
        "0,50 zł (pięćdziesiąt groszy)",
        "0,75 zł (siedemdziesiąt pięć groszy)",
      )
      .replace(
        "99,90 zł (dziewięćdziesiąt dziewięć złotych dziewięćdziesiąt groszy)",
        "99,80 zł (dziewięćdziesiąt dziewięć złotych osiemdziesiąt groszy)",
      );
    const offer = parseLetters(changed, "2026-10-24");
    strictEqual(offer.bonds.ROR.earlyBuyoutCost, 0.75);
    strictEqual(offer.bonds.ROR.exchangeCost, 99.8);
    changed[2].text = changed[2].text.replace("wynosi 4,40%", "wynosi 5,00%");
    throws(() => parseLetters(changed, "2026-10-24"), /Inconsistent TOS/);
    changed[2].text = changed[2].text.replace(
      "113,79 zł (sto trzynaście złotych siedemdziesiąt dziewięć groszy)",
      "115,76 zł (sto piętnaście złotych siedemdziesiąt sześć groszy)",
    );
    strictEqual(
      parseLetters(changed, "2026-10-24").bonds.TOS.firstPeriodRate,
      0.05,
    );
  });
  it("rejects missing/duplicate series, mixed months, invalid dates and foreign sources", () => {
    throws(() => parseLetters(letters().slice(1), "2026-10-24"), /Incomplete/);
    const mixed = letters();
    mixed[1].text = mixed[1].text.replace(
      "od 1 do 31 października 2026",
      "od 1 do 30 listopada 2026",
    );
    throws(() => parseLetters(mixed, "2026-10-24"), /Mixed/);
    throws(() => offerSchema.parse({ ...baseline, saleFrom: "2026-02-30" }));
    const foreign = structuredClone(baseline);
    foreign.bonds.EDO.source = "https://example.com/test.pdf";
    throws(() => offerSchema.parse(foreign));
    throws(() =>
      findPdf(
        '<a href="/media_files/abc.pdf"></a><a href="/media_files/def.pdf"></a>',
      ),
    );
    throws(() => discoverSeries("<option>OTS0127</option>", "2026-10"));
  });
  it("uses stable identities independent of object key order and verification time", () => {
    const offer = offerSchema.parse(baseline);
    strictEqual(
      offerId(offer),
      offerId({
        ...offer,
        version: "different",
        verifiedAt: "2026-10-24",
        bonds: Object.fromEntries(
          Object.entries(offer.bonds).reverse(),
        ) as typeof offer.bonds,
      }),
    );
    const corrected = structuredClone(offer);
    corrected.bonds.TOS.firstPeriodRate = 0.05;
    notStrictEqual(offerId(offer), offerId(corrected));
  });
  it("selects by sale date in Warsaw, not import order, and never activates a future offer early", () => {
    const entries = ["2026-09", "2026-11", "2026-10"].map((month) => ({
      offerId: month,
      month,
      label: month,
      saleFrom: month + "-01",
      saleTo: month + "-30",
    }));
    strictEqual(selectCurrent(entries, "2026-10-31")?.month, "2026-10");
    strictEqual(warsawDate(new Date("2026-10-31T23:00:00Z")), "2026-11-01");
    strictEqual(
      selectCurrent(entries, warsawDate(new Date("2026-10-31T23:00:00Z")))
        ?.month,
      "2026-11",
    );
    strictEqual(selectCurrent(entries, "2026-08-01"), undefined);
  });
  it("pins v4 to a required offer and preserves v3 numerical results for the seed", () => {
    const query = {
      numberOfBonds: "1",
      month: "36",
      inflation: "[0.03]",
      referenceRate: "[0.04]",
      savingsRate: "[0]",
      familyEligible: "true",
      contractVersion: "3",
    };
    const dto = validate(query);
    if (!dto.success) throw dto.error;
    const offer = offerSchema.parse(baseline);
    offer.version = offerId(offer);
    const old = calculateComparison(dto.data);
    const current = calculateComparison(
      { ...dto.data, contractVersion: 4, offerId: offer.version },
      offer,
    );
    deepStrictEqual(old.series, current.series);
    strictEqual(current.offerId, offer.version);
    strictEqual(validate({ ...query, contractVersion: "4" }).success, false);
    strictEqual(
      validate({ ...query, contractVersion: "4", offerId: offer.version })
        .success,
      true,
    );
    offer.bonds.TOS.firstPeriodRate = 0.05;
    const revised = calculateComparison(
      { ...dto.data, contractVersion: 4, offerId: offer.version },
      offer,
    );
    // 100 * 1.05^3 = 115.76 gross, 3.00 tax rounded up = 112.76.
    strictEqual(
      revised.series.find((s) => s.instrumentId === "tos")?.points[35].value,
      112.76,
    );
  });
  it("uses the selected offer's actual calendar in partial-year valuations", () => {
    const params = {
      inflation: [0],
      referenceRate: [0],
      savingsRate: [0],
      wibor6m: [0],
      skipTax: true,
    };
    const bond = {
      ...baseline.bonds.TOS,
      firstPeriodRate: 0.12,
      earlyBuyoutCost: 0,
    };
    const january = simulateBond(bond, 1, 1, params, "2024-01-01")[1]
      .finalValueAtEndOfMath;
    const february = simulateBond(bond, 1, 1, params, "2024-02-01")[1]
      .finalValueAtEndOfMath;
    strictEqual(january, 101.02);
    strictEqual(february, 100.95);
  });
});
