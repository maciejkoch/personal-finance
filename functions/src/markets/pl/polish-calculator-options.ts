/** Polish product options; kept outside the calculation functions. */
export interface PolishTaxOptions {
  skipTax: boolean;
  ike?: boolean;
}

export function effectiveSkipTax(options: PolishTaxOptions): boolean {
  return options.skipTax || options.ike === true;
}

export const POLISH_BOND_TYPES = [
  "ror",
  "dor",
  "tos",
  "coi",
  "edo",
  "ros",
  "rod",
] as const;
export type PolishBondType = (typeof POLISH_BOND_TYPES)[number];

export function availablePolishBonds(options: {
  ike?: boolean;
  familyEligible?: boolean;
}): PolishBondType[] {
  return POLISH_BOND_TYPES.filter(
    (type) =>
      (type !== "ros" && type !== "rod") ||
      (options.familyEligible === true && options.ike !== true),
  );
}
