import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
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
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, action } = await request.json();
  if (!userId || !["block", "unblock"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const isBlock = action === "block";
  const { error } = await supabase
    .from("profiles")
    .update({
      is_blocked: isBlock,
      blocked_at: isBlock ? new Date().toISOString() : null,
      blocked_by: isBlock ? user.id : null,
    })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
