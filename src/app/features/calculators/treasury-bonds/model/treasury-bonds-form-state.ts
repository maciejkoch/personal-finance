import { z } from "zod";

export const bondFormSchema = z.object({
  numberOfBonds: z.number().int().min(1).max(1000000),
  duration: z.number().int().min(1).max(12),
  inflation: z.number().finite().min(-99).max(100),
  referenceRate: z.number().finite().min(0).max(100),
  rate: z.number().finite().min(0).max(100),
  skipTax: z.boolean(),
  familyEligible: z.boolean(),
});
export type BondFormValue = z.infer<typeof bondFormSchema>;
export const bondFormDefaults: BondFormValue = {
  numberOfBonds: 100,
  duration: 12,
  inflation: 3.5,
  referenceRate: 4,
  rate: 0,
  skipTax: false,
  familyEligible: false,
};
export const BOND_STORAGE_KEY = "treasury-bonds-form";

/** Only the current complete format is accepted; old/invalid state uses defaults. */
export function readBondForm(serialized: string | null): BondFormValue {
  try {
    const saved = JSON.parse(serialized || "null");
    if (saved?.schemaVersion !== 4) return { ...bondFormDefaults };
    const result = bondFormSchema.safeParse(saved.values);
    return result.success ? result.data : { ...bondFormDefaults };
  } catch {
    return { ...bondFormDefaults };
  }
}

export function serializeBondForm(values: BondFormValue): string {
  return JSON.stringify({
    schemaVersion: 4,
    values,
  });
}
