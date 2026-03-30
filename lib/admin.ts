import { createSupabaseServerClient } from "@/lib/supabase-server";

export function isAdmin(email: string | undefined): boolean {
  if (process.env.NODE_ENV !== "production" && process.env.LOCAL_ADMIN_BYPASS === "true") {
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
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) return null;
  return user;
}
