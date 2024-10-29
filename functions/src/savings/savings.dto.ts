import { z } from 'zod';

const parseNumber = (value: unknown) => Number(value);

const SavingsSchema = z.object({
  amount: z.preprocess(parseNumber, z.number().gt(0)),
  duration: z.preprocess(parseNumber, z.number().gt(0), z.number().lt(100)),
  inflation: z.preprocess(parseNumber, z.number().gte(0), z.number().lt(1)),
  rate: z.preprocess(parseNumber, z.number().gte(0), z.number().lt(1)),
  skipTax: z.preprocess((value: unknown) => value === 'true', z.boolean()),
});

export type SavingsDTO = z.infer<typeof SavingsSchema>;

export function validateSavings(savings: unknown) {
  return SavingsSchema.safeParse(savings);
}
