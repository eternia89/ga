import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(["request", "asset"]),
  description: z.string().max(200).optional().or(z.literal("")),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
