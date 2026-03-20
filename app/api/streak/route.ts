import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await supabase.rpc("update_user_streak", { user_uuid: user.id });

  const { data: profile } = await supabase
    .from("profiles")
    .select("streak_current,streak_longest,vibe_score")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ profile });
}
