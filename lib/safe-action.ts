import { createSafeActionClient } from "next-safe-action";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LEAD_ROLES, ROLES } from "@/lib/constants/roles";

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    console.error("Action error:", e.message);
    return e.message;
  },
});

// Authenticated action client - checks auth and provides supabase + user
export const authActionClient = actionClient.use(async ({ next }) => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  // Fetch profile for role checking
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.deleted_at) {
    throw new Error("Account deactivated");
  }

  return next({
    ctx: { supabase, user, profile },
  });
});

// GA operations action client — ga_lead or admin, provides adminSupabase (bypasses RLS)
export const gaLeadActionClient = authActionClient.use(async ({ ctx, next }) => {
  if (!(LEAD_ROLES as readonly string[]).includes(ctx.profile.role)) {
    throw new Error("GA Lead or Admin access required");
  }
  const adminSupabase = createAdminClient();
  return next({ ctx: { ...ctx, adminSupabase } });
});

// Admin-only action client — provides adminSupabase (service_role) that bypasses RLS
export const adminActionClient = authActionClient.use(async ({ ctx, next }) => {
  if (ctx.profile.role !== ROLES.ADMIN) {
    throw new Error("Admin access required");
  }
  const adminSupabase = createAdminClient();
  return next({ ctx: { ...ctx, adminSupabase } });
});
