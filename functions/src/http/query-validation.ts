import { z } from "zod";
import type { HttpsFunction } from "firebase-functions/v2/https";

export type HttpResponse = Parameters<HttpsFunction>[1];

// Avoid Number("") / Number([]) silently turning malformed HTTP input into zero.
export const parseQueryNumber = (value: unknown) =>
  typeof value === "string" && value.trim() !== "" ? Number(value) : value;

export const queryBoolean = z.preprocess((value) => {
  if (value === undefined || value === "false") return false;
  if (value === "true") return true;
  return value;
}, z.boolean());

// Keep the public error envelope independent of Zod's Error serialization.
export function validationError(error: z.ZodError) {
  return { name: "ZodError", issues: error.issues };
}
