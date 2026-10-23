import { PolishBondType } from "@markets/pl/polish-calculator-options";
import {
  TreasuryBondsRecord,
  TreasuryBondsResult,
} from "./treasury-bonds.model";

export const bondPresentation: {
  key: PolishBondType;
  label: string;
  color: string;
}[] = [
  { key: "ror", label: "ROR (roczne)", color: "#9333ea" },
  { key: "dor", label: "DOR (2-latki)", color: "#14b8a6" },
  { key: "tos", label: "TOS (3-latki)", color: "#65a30d" },
  { key: "coi", label: "COI (4-latki)", color: "#0284c7" },
  { key: "edo", label: "EDO (10-latki)", color: "#eab308" },
  { key: "ros", label: "ROS (6-latki)", color: "#f43f5e" },
  { key: "rod", label: "ROD (12-latki)", color: "#64748b" },
];

export function visibleBonds(
  result: Pick<TreasuryBondsResult, "activeBondTypes">,
) {
  return bondPresentation.filter(
    (bond) =>
      !result.activeBondTypes || result.activeBondTypes.includes(bond.key),
  );
}

export function bondValue(
  point: TreasuryBondsRecord,
  key: PolishBondType,
): number {
  const value = point[key];
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error(`Missing bond result: ${key}`);
  return value;
}
