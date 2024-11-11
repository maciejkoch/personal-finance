import { z } from 'zod';

const ArticleSchema = z.object({
  slug: z.string(),
});

export type ArticleDTO = z.infer<typeof ArticleSchema>;

export function validateArticle(article: unknown) {
  return ArticleSchema.safeParse(article);
}
