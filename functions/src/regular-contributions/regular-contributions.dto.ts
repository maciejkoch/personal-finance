import { z } from 'zod';

const parseNumber = (value: unknown) => Number(value);

const RegularContributionSchema = z.object({
  contribution: z.preprocess(parseNumber, z.number().gt(0)),
  duration: z.preprocess(parseNumber, z.number().gt(0), z.number().lt(100)),
  rate: z.preprocess(parseNumber, z.number().gte(0), z.number().lt(1)),
  skipTax: z.preprocess((value: unknown) => value === 'true', z.boolean()),
});

export type RegularContributionDTO = z.infer<typeof RegularContributionSchema>;

export function validate(source: unknown) {
  return RegularContributionSchema.safeParse(source);
}
