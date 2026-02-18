import { z } from "zod";

export const divisionSchema = z.object({
  company_id: z.string().uuid("Company is required"),
  name: z.string().min(1, "Name is required").max(100),
  code: z.string().max(10).optional().or(z.literal("")),
  description: z.string().max(200).optional().or(z.literal("")),
});

export type DivisionFormData = z.infer<typeof divisionSchema>;
