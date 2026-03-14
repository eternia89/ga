import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().max(60).email("Valid email is required"),
  full_name: z.string().min(1, "Name is required").max(60),
  role: z.enum(["general_user", "ga_staff", "ga_lead", "finance_approver", "admin"]),
  company_id: z.string().uuid("Company is required"),
  division_id: z.string().uuid("Division is required"),
  location_id: z.string().uuid("Location is required"),
});

export const updateUserSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(60),
  role: z.enum(["general_user", "ga_staff", "ga_lead", "finance_approver", "admin"]),
  company_id: z.string().uuid("Company is required"),
  division_id: z.string().uuid("Division is required").optional().or(z.literal("")),
  location_id: z.string().uuid("Location is required").optional().or(z.literal("")),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
