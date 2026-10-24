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
  familyEligible?: boolean;
}): PolishBondType[] {
  return POLISH_BOND_TYPES.filter(
    (type) =>
      (type !== "ros" && type !== "rod") || options.familyEligible === true,
  );
}
