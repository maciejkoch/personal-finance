import { z } from "zod";

import { parseQueryNumber, queryBoolean } from "../http/query-validation";

const RegularContributionSchema = z.object({
  contribution: z.preprocess(parseQueryNumber, z.number().positive()),
  duration: z.preprocess(parseQueryNumber, z.number().int().min(1).max(100)),
  rate: z.preprocess(parseQueryNumber, z.number().min(0).max(1)),
  skipTax: queryBoolean,
});

export type RegularContributionDTO = z.infer<typeof RegularContributionSchema>;

export function validate(source: unknown) {
  return RegularContributionSchema.safeParse(source);
}
