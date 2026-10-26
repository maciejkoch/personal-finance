import { z } from "zod";

export const appCheckConfiguration = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("off") }),
  z.object({
    mode: z.enum(["monitor", "enforce"]),
    siteKey: z.string().min(1),
    firebase: z.object({
      apiKey: z.string().min(1),
      appId: z.string().min(1),
      projectId: z.string().min(1),
    }),
  }),
]);

export type AppCheckConfiguration = z.infer<typeof appCheckConfiguration>;
