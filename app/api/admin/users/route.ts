import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseServiceClient } from "@/lib/supabase-server";
import { isAdmin, isLocalAdminBypassEnabled } from "@/lib/admin";

export const dynamic = "force-dynamic";

function generateStrongPassword(length = 18) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%^&*()-_=+";
  const all = `${upper}${lower}${numbers}${symbols}`;

  const picks = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  while (picks.length < length) {
    picks.push(all[Math.floor(Math.random() * all.length)]);
  }

  for (let i = picks.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }

  return picks.join("");
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isLocalAdminBypassEnabled() && (!user || !isAdmin(user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: users } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url,vibe_score,streak_current,is_blocked,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return NextResponse.json({ users: users ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isLocalAdminBypassEnabled() && (!user || !isAdmin(user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, action } = await request.json();
  if (!userId || !["block", "unblock", "reset_password"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (action === "reset_password") {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Password reset is not configured. Missing SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    try {
      const adminClient = createSupabaseServiceClient();
      const temporaryPassword = generateStrongPassword();
      const { error } = await adminClient.auth.admin.updateUserById(userId, {
        password: temporaryPassword,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, temporaryPassword });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reset password";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const isBlock = action === "block";
  const { error } = await supabase
    .from("profiles")
    .update({
      is_blocked: isBlock,
      blocked_at: isBlock ? new Date().toISOString() : null,
      blocked_by: isBlock ? user?.id ?? null : null,
    })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
