import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

export type CompanyFormData = z.infer<typeof companySchema>;
