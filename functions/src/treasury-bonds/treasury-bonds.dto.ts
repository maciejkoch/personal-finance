import { z } from 'zod';

const parseNumber = (value: unknown) => Number(value);
const treasuryBondsParam = z.preprocess(safeParseArray, z.array(z.number().gte(0), z.number().lte(1)).min(1).max(12));

const TreasuryBondsSchema = z.object({
  numberOfBonds: z.preprocess(parseNumber, z.number().gt(0)),
  month: z.preprocess(parseNumber, z.number().gt(0), z.number().lt(144)),
  inflation: treasuryBondsParam,
  wibor6m: treasuryBondsParam,
  referenceRate: treasuryBondsParam,
  savingsRate: treasuryBondsParam,
});

export type TreasuryBondsSchemaDTO = z.infer<typeof TreasuryBondsSchema>;

export function validate(source: unknown) {
  return TreasuryBondsSchema.safeParse(source);
}

function safeParseArray(value: unknown): number[] | null {
  try {
    return value && JSON.parse(value as string);
  } catch {
    return null;
  }
}
