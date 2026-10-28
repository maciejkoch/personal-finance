import { strictEqual, deepStrictEqual, throws, ok } from "node:assert";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { discoverCsv, parseInflation, checkedSourceUrl } from "./parser";
import { inflationFreshness } from "../contracts/inflation";
import { calculate } from "../savings/savings.service";
const fixture = readFileSync(
  resolve(__dirname, "../../src/inflation/fixtures/gus-2026-10.csv"),
);
const header =
  "Nazwa zmiennej;Jednostka terytorialna;Sposób prezentacji;Rok;Miesiąc;Wartość;Flaga;;\r\n";
const row = (month = "9", value = "104,1", flag = "") =>
  `Wskaźnik cen towarów i usług konsumpcyjnych;Polska;Analogiczny miesiąc poprzedniego roku = 100;2026;${month};${value};${flag};;`;
const parse = (v: string) =>
  parseInflation(Buffer.from(header + v), "2026-10-28");
describe("GUS inflation", () => {
  it("parses the original Windows-1250 official CSV including hyperinflation, zero and deflation", () => {
    const points = parseInflation(fixture, "2026-10-28");
    strictEqual(points.length, 537);
    deepStrictEqual(points[0], {
      period: "1982-01",
      indexValue: 153.2,
      ratePercent: 53.2,
      flag: "",
    });
    deepStrictEqual(points.at(-1), {
      period: "2026-09",
      indexValue: 104.1,
      ratePercent: 4.1,
      flag: "",
    });
    strictEqual(
      points.find((p) => p.period === "1990-02")?.ratePercent,
      1183.1,
    );
    strictEqual(points.find((p) => p.period === "2015-02")?.ratePercent, -1.6);
    strictEqual(points.find((p) => p.period === "2016-11")?.ratePercent, 0);
  });
  it("accepts quoted CSV and ignores blank future values without substituting zero", () => {
    deepStrictEqual(parse(row("9", "100") + "\r\n" + row("11", "")), [
      { period: "2026-09", indexValue: 100, ratePercent: 0, flag: "" },
    ]);
    strictEqual(parse(row("9", '"99,5"'))[0].ratePercent, -0.5);
  });
  it("rejects unknown formats, flags, duplicates, future observations, wrong territories and missing series", () => {
    for (const value of [
      row("9", "NaN"),
      row("11"),
      row("9", "104,1", "p"),
      row() + "\n" + row(),
      row().replace("Polska", "Warszawa"),
      row().replace(
        "Analogiczny miesiąc poprzedniego roku",
        "Poprzedni miesiąc",
      ),
    ])
      throws(() => parse(value));
    throws(() =>
      parseInflation(Buffer.from("unexpected format"), "2026-10-28"),
    );
  });
  it("discovers one canonical CSV URL and rejects foreign URLs", () => {
    strictEqual(
      discoverCsv(
        '<span class="file-url d-none">https://publikacje.new.stat.gov.pl/sites/default/files/test.csv</span>',
      ),
      "https://publikacje.new.stat.gov.pl/sites/default/files/test.csv",
    );
    throws(() =>
      discoverCsv(
        '<span class="file-url">https://evil.example/test.csv</span>',
      ),
    );
    throws(() =>
      checkedSourceUrl("https://publikacje.new.stat.gov.pl.evil.example/a"),
    );
    throws(() => discoverCsv("no attachment"));
  });
  it("distinguishes a stale observation from a failed source check across Warsaw month boundaries", () => {
    deepStrictEqual(
      inflationFreshness(
        "2026-08",
        "2026-10-28T08:00:00Z",
        new Date("2026-10-28T09:00:00Z"),
      ),
      { dataStale: false, syncStale: false },
    );
    ok(
      inflationFreshness(
        "2026-08",
        "2026-10-28T08:00:00Z",
        new Date("2026-10-31T23:30:00Z"),
      ).dataStale,
    );
    ok(
      inflationFreshness(
        "2026-09",
        "2026-10-26T08:00:00Z",
        new Date("2026-10-28T09:00:00Z"),
      ).syncStale,
    );
  });
  it("calculates an independent deflation scenario for the savings goal", () => {
    const result = calculate(10000, 1, -0.02, 0);
    strictEqual(result.futureValue, 9800);
    strictEqual(result.monthlyContribution, 816.67);
  });
});
