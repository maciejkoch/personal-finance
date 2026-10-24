import { z } from "zod";
import { CALCULATOR_LIMITS } from "../contracts/savings";

import { parseQueryNumber, queryBoolean } from "../http/query-validation";

const SavingsSchema = z.object({
  amount: z.preprocess(
    parseQueryNumber,
    z.number().min(0.01).max(CALCULATOR_LIMITS.capital),
  ),
  initialCapital: z
    .preprocess(
      parseQueryNumber,
      z.number().min(0).max(CALCULATOR_LIMITS.capital),
    )
    .optional()
    .default(0),
  duration: z.preprocess(parseQueryNumber, z.number().int().min(1).max(100)),
  inflation: z.preprocess(parseQueryNumber, z.number().min(0).max(1)),
  rate: z.preprocess(parseQueryNumber, z.number().min(0).max(1)),
  skipTax: queryBoolean,
});

export type SavingsDTO = z.infer<typeof SavingsSchema>;

export function validateSavings(savings: unknown) {
  return SavingsSchema.safeParse(savings);
}
