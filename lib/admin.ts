import { createSupabaseServerClient } from "@/lib/supabase-server";

export function isLocalAdminBypassEnabled(): boolean {
  return process.env.LOCAL_ADMIN_BYPASS === "true";
}

export function isAdmin(email: string | undefined): boolean {
  if (isLocalAdminBypassEnabled()) {
    return true;
  }
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

export async function requireAdmin() {
  if (isLocalAdminBypassEnabled()) {
    return { id: "local-admin-bypass", email: "local-admin@liftly.test" };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) return null;
  return user;
}
