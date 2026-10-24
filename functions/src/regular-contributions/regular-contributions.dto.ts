import { z } from "zod";
import { CALCULATOR_LIMITS } from "../contracts/savings";

import { parseQueryNumber, queryBoolean } from "../http/query-validation";

const RegularContributionSchema = z
  .object({
    contribution: z.preprocess(
      parseQueryNumber,
      z.number().min(0).max(CALCULATOR_LIMITS.contribution),
    ),
    initialCapital: z
      .preprocess(
        parseQueryNumber,
        z.number().min(0).max(CALCULATOR_LIMITS.capital),
      )
      .optional()
      .default(0),
    duration: z.preprocess(parseQueryNumber, z.number().int().min(1).max(100)),
    rate: z.preprocess(parseQueryNumber, z.number().min(0).max(1)),
    skipTax: queryBoolean,
  })
  .refine((value) => value.contribution > 0 || value.initialCapital > 0, {
    path: ["contribution"],
    message: "Podaj dodatnią wpłatę lub kapitał początkowy.",
  });

export type RegularContributionDTO = z.infer<typeof RegularContributionSchema>;

export function validate(source: unknown) {
  return RegularContributionSchema.safeParse(source);
}
