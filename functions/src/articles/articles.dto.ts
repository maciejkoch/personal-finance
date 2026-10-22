import { z } from "zod";

const ArticleSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(120),
});

export type ArticleDTO = z.infer<typeof ArticleSchema>;

export function validateArticle(article: unknown) {
  return ArticleSchema.safeParse(article);
}
