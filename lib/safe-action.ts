import { createSafeActionClient } from "next-safe-action";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

// Admin-only action client — provides adminSupabase (service_role) that bypasses RLS
export const adminActionClient = authActionClient.use(async ({ ctx, next }) => {
  if (ctx.profile.role !== "admin") {
    throw new Error("Admin access required");
  }
  const adminSupabase = createAdminClient();
  return next({ ctx: { ...ctx, adminSupabase } });
});
