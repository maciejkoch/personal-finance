import type { Request } from "firebase-functions/v2/https";
import { HttpResponse, validationError } from "../http/query-validation";

import { validate } from "./regular-contributions.dto";
import { calculate } from "./regular-contributions.service";
import { z } from "zod";
import { RANGE_ERROR_MESSAGE } from "../contracts/savings";

export function execute(request: Request, response: HttpResponse): void {
  const regularContribution = validate(request.query);

  if (regularContribution.success) {
    try {
      const { contribution, duration, rate, initialCapital } =
        regularContribution.data;
      const result = calculate(
        contribution,
        duration,
        rate,
        regularContribution.data.skipTax,
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
    response.send(validationError(regularContribution.error));
  }
}
