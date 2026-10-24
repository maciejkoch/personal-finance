import { HttpErrorResponse } from "@angular/common/http";
import { RANGE_ERROR_MESSAGE } from "@contracts/savings";

export function calculationError(error: unknown): string {
  if (
    error instanceof HttpErrorResponse &&
    error.status === 400 &&
    error.error?.name === "CalculationRangeError"
  )
    return RANGE_ERROR_MESSAGE;
  return "Nie udało się obliczyć wyniku. Spróbuj ponownie lub zmień ustawienia.";
}
