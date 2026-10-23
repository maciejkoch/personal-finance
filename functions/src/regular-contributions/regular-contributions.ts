import type { Request } from "firebase-functions/v2/https";
import { HttpResponse, validationError } from "../http/query-validation";

import { validate } from "./regular-contributions.dto";
import { calculate } from "./regular-contributions.service";
import { effectiveSkipTax } from "../markets/pl/polish-calculator-options";

export function execute(request: Request, response: HttpResponse): void {
  const regularContribution = validate(request.query);

  if (regularContribution.success) {
    try {
      const { contribution, duration, rate } = regularContribution.data;
      const result = calculate(
        contribution,
        duration,
        rate,
        effectiveSkipTax(regularContribution.data),
      );
      response.status(200);
      response.send({ data: result });
    } catch (error) {
      response.status(500);
      response.send(error);
    }
  } else {
    response.status(400);
    response.send(validationError(regularContribution.error));
  }
}
