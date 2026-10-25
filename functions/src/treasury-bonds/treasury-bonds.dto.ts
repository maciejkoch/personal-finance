import { z } from "zod";

import { parseQueryNumber, queryBoolean } from "../http/query-validation";
const rates = (min: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    },
    z.array(z.number().finite().min(min).max(1)).min(1).max(12),
  );

const TreasuryBondsSchema = z
  .object({
    numberOfBonds: z.preprocess(
      parseQueryNumber,
      z.number().int().min(1).max(1000000),
    ),
    month: z.preprocess(parseQueryNumber, z.number().int().min(1).max(144)),
    inflation: rates(-0.99),
    // Accepted for existing clients; TOS has a fixed rate and never uses WIBOR.
    wibor6m: rates(0).optional().default([0]),
    referenceRate: rates(0),
    savingsRate: rates(0),
    skipTax: queryBoolean,
    familyEligible: queryBoolean.optional(),
    offerId: z
      .string()
      .regex(/^20\d{2}-\d{2}-[a-f0-9]{24}$/)
      .optional(),
    contractVersion: z
      .preprocess(parseQueryNumber, z.union([z.literal(3), z.literal(4)]))
      .optional(),
  })
  .refine(
    (value) =>
      value.contractVersion !== 4 ||
      (value.offerId !== undefined && value.familyEligible !== undefined),
    { message: "contractVersion 4 requires offerId and familyEligible" },
  );

export type TreasuryBondsSchemaDTO = z.infer<typeof TreasuryBondsSchema>;
export function validate(source: unknown) {
  return TreasuryBondsSchema.safeParse(source);
}
