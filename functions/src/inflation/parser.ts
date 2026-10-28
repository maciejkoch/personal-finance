import {
  INFLATION_SOURCE,
  pointsSchema,
  type InflationPoint,
} from "../contracts/inflation";

export const parserVersion = "gus-csv-v1";
export function discoverCsv(html: string): string {
  // Drupal exposes the canonical file URL separately from its tokenized download route.
  const urls = [
    ...html.matchAll(
      /<span[^>]*class="[^"]*file-url[^"]*"[^>]*>([^<]+\.csv)<\/span>/gi,
    ),
  ].map((m) => m[1].trim().replaceAll("&amp;", "&"));
  if (new Set(urls).size !== 1)
    throw new Error("Expected one GUS CSV attachment");
  return checkedSourceUrl(urls[0]);
}
export function checkedSourceUrl(value: string): string {
  const url = new URL(value, INFLATION_SOURCE);
  if (
    url.origin !== new URL(INFLATION_SOURCE).origin ||
    url.username ||
    url.password
  )
    throw new Error("Unexpected source URL");
  return url.href;
}
/** RFC-style quoted fields, including embedded delimiters and CRLF. */
export function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (quoted || field === "") quoted = !quoted;
      else throw new Error("Invalid CSV quoting");
    } else if (!quoted && (c === ";" || c === "\n" || c === "\r")) {
      row.push(field);
      field = "";
      if (c !== ";") {
        rows.push(row);
        row = [];
        if (c === "\r" && text[i + 1] === "\n") i++;
      }
    } else field += c;
  }
  if (quoted) throw new Error("Unclosed CSV field");
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim()));
}
export function parseInflation(
  bytes: Uint8Array,
  today: string,
): InflationPoint[] {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    text = new TextDecoder("windows-1250", { fatal: true }).decode(bytes);
  }
  const rows = csvRows(text.replace(/^\uFEFF/, ""));
  const header = [
    "Nazwa zmiennej",
    "Jednostka terytorialna",
    "Sposób prezentacji",
    "Rok",
    "Miesiąc",
    "Wartość",
    "Flaga",
  ];
  if (!rows[0] || header.some((h, i) => rows[0][i]?.trim() !== h))
    throw new Error("Unknown GUS CSV header");
  const points: InflationPoint[] = [];
  for (const row of rows.slice(1)) {
    if (row[2]?.trim() !== "Analogiczny miesiąc poprzedniego roku = 100")
      continue;
    if (
      row[0]?.trim() !== "Wskaźnik cen towarów i usług konsumpcyjnych" ||
      row[1]?.trim() !== "Polska"
    )
      throw new Error("Unexpected GUS series");
    const [, , , year, month, raw, flag] = row.map((v) => v.trim());
    if (!/^(19|20)\d{2}$/.test(year) || !/^(?:[1-9]|1[0-2])$/.test(month))
      throw new Error("Invalid period");
    const period = `${year}-${month.padStart(2, "0")}`;
    if (!raw) continue;
    if (period > today.slice(0, 7)) throw new Error("Future observation");
    if (!/^\d+(?:[,.]\d+)?$/.test(raw) || !["", "a"].includes(flag))
      throw new Error("Unknown value or flag");
    const indexValue = Number(raw.replace(",", "."));
    points.push({
      period,
      indexValue,
      ratePercent: Number((indexValue - 100).toFixed(4)),
      flag: flag as "" | "a",
    });
  }
  return pointsSchema.parse(
    points.sort((a, b) => a.period.localeCompare(b.period)),
  );
}
