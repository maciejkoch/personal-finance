import type { Request } from "firebase-functions/v2/https";
import { HttpResponse, validationError } from "../http/query-validation";

import { validateSavings } from "./savings.dto";
import { calculate } from "./savings.service";
import { z } from "zod";
import { RANGE_ERROR_MESSAGE } from "../contracts/savings";

export function execute(request: Request, response: HttpResponse): void {
  const savings = validateSavings(request.query);

  if (savings.success) {
    try {
      const { amount, duration, inflation, rate, initialCapital } =
        savings.data;
      const result = calculate(
        amount,
        duration,
        inflation,
        rate,
        savings.data.skipTax,
        initialCapital,
      );
      response.status(200);
      response.send({ data: result });
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof RangeError) {
        response
          .status(400)
          .send({
            name: "CalculationRangeError",
            message: RANGE_ERROR_MESSAGE,
          });
      } else {
        response
          .status(500)
          .send({ message: "Nie udało się obliczyć wyniku." });
      }
    }
  } else {
    response.status(400);
    response.send(validationError(savings.error));
  }
}
