import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  code: z.string().length(2, "Code must be exactly 2 characters").toUpperCase(),
  address: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().max(60).email("Invalid email").optional().or(z.literal("")),
});

export type CompanyFormData = z.infer<typeof companySchema>;
