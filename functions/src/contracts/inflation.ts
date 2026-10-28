import { z } from "zod";

export const INFLATION_SOURCE =
  "https://publikacje.new.stat.gov.pl/portal-publikacje/miesieczne-wskazniki-cen-towarow-i-uslug-konsumpcyjnych-od-1982-r";
export const periodSchema = z.string().regex(/^(19|20)\d{2}-(0[1-9]|1[0-2])$/);
export const inflationPointSchema = z
  .object({
    period: periodSchema,
    indexValue: z.number().positive().max(100000),
    ratePercent: z.number().finite(),
    flag: z.enum(["", "a"]),
  })
  .refine((p) => Math.abs(p.ratePercent - (p.indexValue - 100)) < 0.000001);
export type InflationPoint = z.infer<typeof inflationPointSchema>;
export const pointsSchema = z
  .array(inflationPointSchema)
  .min(1)
  .max(2000)
  .refine(
    (points) =>
      points.every((p, i) => i === 0 || points[i - 1].period < p.period),
    "Periods must be unique and sorted",
  );
export const datasetIdSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const currentInflationSchema = z.object({
  schemaVersion: z.literal(1),
  series: z.literal("PL_CPI_ALL_YOY"),
  datasetId: datasetIdSchema,
  readingId: z.string(),
  point: inflationPointSchema,
  sourcePageUrl: z.literal(INFLATION_SOURCE),
  checkedAt: z.iso.datetime(),
  dataStale: z.boolean(),
  syncStale: z.boolean(),
});
export type CurrentInflation = z.infer<typeof currentInflationSchema>;
export const inflationHistorySchema = z.object({
  schemaVersion: z.literal(1),
  datasetId: datasetIdSchema,
  points: z.array(inflationPointSchema).max(250),
  nextCursor: periodSchema.nullable(),
});
export type InflationHistory = z.infer<typeof inflationHistorySchema>;
export function inflationFreshness(
  period: string,
  checkedAt: string,
  now = new Date(),
) {
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
  }).format(now);
  const monthNumber = (v: string) =>
    Number(v.slice(0, 4)) * 12 + Number(v.slice(5, 7));
  return {
    dataStale: monthNumber(today) - monthNumber(period) > 2,
    syncStale: now.getTime() - Date.parse(checkedAt) > 26 * 3600000,
  };
}
