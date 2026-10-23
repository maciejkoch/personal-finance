export interface SectionLink {
  readonly label: string;
  readonly link: string;
}

export const CALCULATOR_LINKS: readonly SectionLink[] = [
  { label: "Obligacje skarbowe", link: "/kalkulatory/obligacje-skarbowe" },
  { label: "Cel długoterminowy", link: "/kalkulatory/oszczedzanie-na-cel" },
  {
    label: "Regularne oszczędzanie",
    link: "/kalkulatory/regularne-oszczedzanie",
  },
];

export const GUIDE_LINKS: readonly SectionLink[] = [
  { label: "Poradnik obligacji", link: "/kalkulator-obligacji-skarbowych" },
  { label: "Poradnik oszczędzania", link: "/oszczedzaj-regularnie" },
];
