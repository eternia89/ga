import { z } from "zod";

export const locationSchema = z.object({
  company_id: z.string().uuid("Company is required"),
  name: z.string().min(1, "Name is required").max(60),
  address: z.string().max(200).optional().or(z.literal("")),
});

export type LocationFormData = z.infer<typeof locationSchema>;
