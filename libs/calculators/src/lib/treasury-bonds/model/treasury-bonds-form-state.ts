import { z } from "zod";
import * as offer from "@pf/bond-offer";

export const bondFormSchema = z.object({
  numberOfBonds: z.number().int().min(1).max(1000000),
  duration: z.number().int().min(1).max(12),
  inflation: z.number().finite().min(-99).max(100),
  referenceRate: z.number().finite().min(0).max(100),
  rate: z.number().finite().min(0).max(100),
  skipTax: z.boolean(),
});
export type BondFormValue = z.infer<typeof bondFormSchema>;
export const bondFormDefaults: BondFormValue = {
  numberOfBonds: 100,
  duration: 12,
  inflation: 3.5,
  referenceRate: 4,
  rate: 0,
  skipTax: false,
};
export const BOND_STORAGE_KEY = "treasury-bonds-form";

/** Preserve valid legacy assumptions individually; invalid fields use defaults. */
export function readBondForm(serialized: string | null): BondFormValue {
  try {
    const saved = JSON.parse(serialized || "null");
    if (!saved || typeof saved !== "object" || Array.isArray(saved))
      return { ...bondFormDefaults };
    if ("schemaVersion" in saved && saved.schemaVersion !== 2)
      return { ...bondFormDefaults };
    const source = saved.schemaVersion === 2 ? saved.values : saved;
    if (!source || typeof source !== "object") return { ...bondFormDefaults };
    const values = { ...bondFormDefaults };
    for (const key of Object.keys(
      bondFormSchema.shape,
    ) as (keyof BondFormValue)[]) {
      const parsed = bondFormSchema.shape[key].safeParse(source[key]);
      if (parsed.success) Object.assign(values, { [key]: parsed.data });
    }
    return values;
  } catch {
    return { ...bondFormDefaults };
  }
}

export function serializeBondForm(values: BondFormValue): string {
  return JSON.stringify({
    schemaVersion: 2,
    offerVersion: offer.version,
    values,
  });
}
