import type { Request, Response } from "express";
import {
  OfferRepository,
  OfferError,
  selectCurrent,
  warsawDate,
} from "./repository";

export async function serveOffers(
  request: Request,
  response: Response,
): Promise<void> {
  response.setHeader("Cache-Control", "no-store");
  try {
    const repo = new OfferRepository();
    if (request.query.action === "offer") {
      if (typeof request.query.offerId !== "string")
        throw new OfferError(400, "offerId required");
      response
        .status(200)
        .send({ data: await repo.get(request.query.offerId) });
      return;
    }
    const cursor = request.query.cursor;
    if (
      cursor !== undefined &&
      (typeof cursor !== "string" || !/^20\d{2}-\d{2}$/.test(cursor))
    )
      throw new OfferError(400, "Invalid cursor");
    const entries = await repo.catalog();
    const today = warsawDate();
    const current = selectCurrent(entries, today);
    const page = entries
      .filter((e) => !cursor || e.month < cursor)
      .slice(0, 25);
    response.status(200).send({
      data: {
        today,
        entries: page,
        currentOfferId: current?.offerId ?? null,
        stale: !current || current.saleTo < today,
        nextCursor:
          page.length === 25 && entries.some((e) => e.month < page[24].month)
            ? page[24].month
            : null,
      },
    });
  } catch (error) {
    response.status(error instanceof OfferError ? error.status : 503).send({
      error:
        error instanceof OfferError ? error.message : "Offer data unavailable",
    });
  }
}
