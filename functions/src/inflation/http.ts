import type { Request, Response } from "express";
import { z } from "zod";
import { datasetIdSchema, periodSchema } from "../contracts/inflation";
import { InflationError, InflationRepository } from "./repository";

const querySchema = z
  .object({
    action: z.enum(["current", "history"]).default("current"),
    datasetId: datasetIdSchema.optional(),
    from: periodSchema.optional(),
    to: periodSchema.optional(),
    cursor: periodSchema.optional(),
  })
  .strict()
  .refine((q) => !q.from || !q.to || q.from <= q.to);
export async function serveInflation(
  request: Request,
  response: Response,
): Promise<void> {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "GET") {
    response.status(405).send({ error: "GET required" });
    return;
  }
  const query = querySchema.safeParse(request.query);
  if (!query.success) {
    response.status(400).send({ error: "Invalid inflation query" });
    return;
  }
  try {
    const repo = new InflationRepository();
    const q = query.data;
    if (q.action === "current") {
      response.status(200).send({ data: await repo.current() });
      return;
    }
    const history = await repo.history(q.datasetId);
    const filtered = history.points.filter(
      (p) =>
        (!q.from || p.period >= q.from) &&
        (!q.to || p.period <= q.to) &&
        (!q.cursor || p.period > q.cursor),
    );
    response
      .status(200)
      .send({
        data: {
          schemaVersion: 1,
          datasetId: history.datasetId,
          points: filtered.slice(0, 250),
          nextCursor: filtered.length > 250 ? filtered[249].period : null,
        },
      });
  } catch (error) {
    response
      .status(error instanceof InflationError ? error.status : 503)
      .send({
        error:
          error instanceof InflationError
            ? error.message
            : "Inflation unavailable",
      });
  }
}
