export interface FireInput {
  age: number;
  capital: number;
  contribution: number;
  expenses: number;
  annualReturn: number;
  inflation: number;
  withdrawalRate: number;
}

export const FIRE_DEFAULTS: FireInput = {
  age: 30,
  capital: 100000,
  contribution: 3000,
  expenses: 5000,
  annualReturn: 6,
  inflation: 2.5,
  withdrawalRate: 3.5,
};

export const FIRE_FIELDS = [
  {
    key: "age",
    label: "Twój wiek (lata)",
    min: 18,
    max: 100,
    step: 1,
    hint: "Pełna liczba od 18 do 100.",
  },
  {
    key: "capital",
    label: "Zainwestowany kapitał (zł)",
    min: 0,
    max: 100000000,
    step: 1000,
    hint: "Od 0 do 100 mln zł. Środki dostępne na finansowanie FIRE.",
  },
  {
    key: "contribution",
    label: "Miesięczna wpłata (zł)",
    min: 0,
    max: 1000000,
    step: 100,
    hint: "Od 0 do 1 mln zł. Zakładamy wzrost wpłat wraz z inflacją.",
  },
  {
    key: "expenses",
    label: "Miesięczne wydatki na FIRE (zł)",
    min: 1,
    max: 1000000,
    step: 100,
    hint: "Od 1 do 1 mln zł w dzisiejszych cenach, łącznie z rezerwą na podatki od wypłat.",
  },
  {
    key: "annualReturn",
    label: "Roczna stopa zwrotu netto (%)",
    min: -20,
    max: 20,
    step: 0.1,
    hint: "Od −20% do 20%, przed inflacją, po kosztach i podatkach w okresie oszczędzania.",
  },
  {
    key: "inflation",
    label: "Roczna inflacja (%)",
    min: -99,
    max: 100,
    step: 0.1,
    hint: "Od −99% do 100%. Stała w całym scenariuszu.",
  },
  {
    key: "withdrawalRate",
    label: "Początkowa roczna stopa wypłat (%)",
    min: 0.5,
    max: 10,
    step: 0.1,
    hint: "Od 0,5% do 10%. Niższa stopa oznacza wyższy cel kapitałowy.",
  },
] as const;

export function validFireInput(input: FireInput): boolean {
  return (
    FIRE_FIELDS.every(
      ({ key, min, max }) =>
        Number.isFinite(input[key]) && input[key] >= min && input[key] <= max,
    ) && Number.isInteger(input.age)
  );
}

/** Constant purchasing power; effective annual return; end-of-month deposits. */
export function calculateFire(input: FireInput) {
  if (!validFireInput(input))
    throw new RangeError("Nieprawidłowe założenia FIRE.");
  const target = (input.expenses * 12) / (input.withdrawalRate / 100);
  const realReturn =
    (1 + input.annualReturn / 100) / (1 + input.inflation / 100) - 1;
  const monthlyReturn = Math.expm1(Math.log1p(realReturn) / 12);
  let capital = input.capital;
  let months = capital >= target ? 0 : null;
  const points = [{ month: 0, capital }];
  for (let month = 1; month <= 1200 && months === null; month++) {
    capital = capital * (1 + monthlyReturn) + input.contribution;
    if (capital >= target) months = month;
    if (month % 12 === 0 || months !== null) points.push({ month, capital });
  }
  return {
    target,
    realReturn,
    months,
    points,
    progress: Math.min(100, (input.capital / target) * 100),
    gap: Math.max(0, target - input.capital),
  };
}
