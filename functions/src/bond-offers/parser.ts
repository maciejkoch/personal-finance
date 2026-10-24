import baseline from "../treasury-bonds/treasury-bonds.offer.json";
import septemberTemplates from "./fixtures/letters-2026-09.json";
import templates from "./fixtures/letters-2026-10.json";
import {
  BondOffer,
  BondType,
  bondTypes,
  offerSchema,
} from "../contracts/bond-offer";

export const parserVersion = "letters-v1";
const months = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "września",
  "października",
  "listopada",
  "grudnia",
];
const monthPattern = months.join("|");
const normalize = (text: string) =>
  text
    .normalize("NFC")
    .replace(/-- \d+ of \d+ --/g, " ")
    .replace(/\s+/g, " ")
    .trim();
function match(text: string, regex: RegExp): RegExpMatchArray {
  const result = text.match(regex);
  if (!result)
    throw new Error(`Unrecognized issue letter field: ${regex.source}`);
  return result;
}
const percent = (value: string) => Number(value.replace(",", "")) / 10000;
const firstRate =
  /(?:W pierwszym okresie odsetkowym stopa procentowa wynosi|Oprocentowanie obligacji wynosi) (\d+,\d{2})%/;
const margin = /marż[ęy] w wysokości (\d+,\d{2})%/;
const feePattern =
  /(?:nie wyższą niż|pomniejszana o kwotę) (\d+,\d{2}) zł \([^)]*\)/g;
const exchangePattern =
  /Cena zamiany jednej obligacji wynosi (\d+,\d{2}) zł \([^)]*\)/;
const tosValuePattern =
  /Wartość wierzytelności z tytułu wykupu jednej obligacji, obejmująca wartość nominalną oraz należne odsetki, wynosi (\d+,\d{2}) zł \([^)]*\)/;
const amount = (value: string) => Number(value.replace(",", "")) / 100;
function maskAmount(value: string): string {
  return value.replace(/\d+,\d{2} zł \([^)]*\)/, "<AMOUNT> zł (<WORDS>)");
}
/** Compare the entire normalized legal text, including annexes. Only known
 * issuance identifiers, calendar dates and extracted rates/amounts may vary. Any other
 * change in legal structure or formulas requires a reviewed parser/template update.
 */
export function legalTemplate(text: string): string {
  return normalize(text)
    .replace(/\b\d{2}\.\d{2}\.\d{4}\b/g, "<CALENDAR_DATE>")
    .replace(/(?:<CALENDAR_DATE>\s*)+/g, "<CALENDAR_DATES> ")
    .replace(feePattern, maskAmount)
    .replace(exchangePattern, maskAmount)
    .replace(tosValuePattern, maskAmount)
    .replace(firstRate, (s) => s.replace(/\d+,\d{2}/, "<RATE>"))
    .replace(margin, (s) => s.replace(/\d+,\d{2}/, "<MARGIN>"))
    .replace(/\b(?:OTS|ROR|DOR|TOS|COI|EDO|ROS|ROD)\d{4}\b/g, "<SERIES>")
    .replace(
      /((?:LIST EMISYJNY|Listu Emisyjnego|Nr)\s*(?:nr\s*)?)\d+\/\d{4}/gi,
      "$1<LETTER>",
    )
    .replace(
      new RegExp(
        `\\b\\d{1,2} (?:do (?:dnia )?\\d{1,2} )?(?:${monthPattern}) \\d{4}`,
        "g",
      ),
      "<DATE>",
    );
}
export interface Letter {
  type: BondType;
  text: string;
  url: string;
  sha256: string;
}
export function parseLetters(letters: Letter[], verifiedAt: string): BondOffer {
  if (letters.length !== 7 || new Set(letters.map((l) => l.type)).size !== 7)
    throw new Error("Incomplete issue letters");
  const offer = structuredClone(baseline) as BondOffer;
  let period = "";
  for (const type of bondTypes) {
    const letter = letters.find((l) => l.type === type);
    if (!letter) throw new Error(`Missing ${type}`);
    const text = normalize(letter.text);
    if (
      ![templates[type], septemberTemplates[type]].some(
        (template) => legalTemplate(text) === legalTemplate(template),
      )
    )
      throw new Error(`Unsupported legal changes in ${type}; review required`);
    const sale = match(
      text,
      new RegExp(
        `oferowane (?:przez agenta emisji )?do sprzedaży w dniach od (\\d+) do (\\d+) (${monthPattern}) (\\d{4}) r\\.`,
      ),
    );
    const month = `${sale[4]}-${String(months.indexOf(sale[3]) + 1).padStart(2, "0")}`;
    const saleFrom = `${month}-${sale[1].padStart(2, "0")}`;
    const saleTo = `${month}-${sale[2].padStart(2, "0")}`;
    if (period && period !== `${saleFrom}/${saleTo}`)
      throw new Error("Mixed offer months");
    period = `${saleFrom}/${saleTo}`;
    offer.month = month;
    offer.saleFrom = saleFrom;
    offer.saleTo = saleTo;
    const bond = offer.bonds[type];
    bond.series = match(text, new RegExp(`\\b${type}\\d{4}\\b`))[0];
    bond.firstPeriodRate = percent(match(text, firstRate)[1]);
    bond.margin = type === "TOS" ? 0 : percent(match(text, margin)[1]);
    const fees = [...text.matchAll(feePattern)].map((item) => amount(item[1]));
    if (!fees.length || fees.some((fee) => fee !== fees[0]))
      throw new Error(`Inconsistent fees in ${type}`);
    bond.earlyBuyoutCost = fees[0];
    bond.exchangeCost = bond.familyOnly
      ? 100
      : amount(match(text, exchangePattern)[1]);
    if (type === "TOS") {
      const gross = amount(match(text, tosValuePattern)[1]);
      if (
        Math.round(100 * (1 + bond.firstPeriodRate) ** 3 * 100) / 100 !==
        gross
      )
        throw new Error("Inconsistent TOS maturity value");
    }
    bond.source = letter.url;
    bond.issueLetter = match(text, /LIST EMISYJNY nr (\d+\/\d{4})/i)[1];
  }
  offer.label = new Intl.DateTimeFormat("pl-PL", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${offer.saleFrom}T00:00:00Z`));
  offer.version = `${offer.month}-${parserVersion}`;
  offer.verifiedAt = verifiedAt;
  return offerSchema.parse(offer);
}

export function discoverSeries(
  html: string,
  month: string,
): Record<BondType, string> {
  const [year, monthNumber] = month.split("-").map(Number);
  return Object.fromEntries(
    bondTypes.map((type) => {
      const date = new Date(
        Date.UTC(
          year,
          monthNumber - 1 + baseline.bonds[type].maturityInMonths,
          1,
        ),
      );
      const series = `${type}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCFullYear()).slice(-2)}`;
      if (!html.toUpperCase().includes(`?ID=${series},`))
        throw new Error(`Missing published series ${series}`);
      return [type, series];
    }),
  ) as Record<BondType, string>;
}
export function findPdf(html: string): string {
  const urls = [
    ...html.matchAll(/href=["'](\/media_files\/[a-f0-9-]+\.pdf)["']/gi),
  ].map((m) => m[1]);
  if (new Set(urls).size !== 1)
    throw new Error("Ambiguous or missing issue PDF");
  return `https://www.obligacjeskarbowe.pl${urls[0]}`;
}
