import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, severity } = await request.json();

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("bug_reports")
    .insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      severity: severity ?? "low",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Award +5 vibe for reporting a bug
  const { data: profile } = await supabase
    .from("profiles")
    .select("vibe_score")
    .eq("id", user.id)
    .single();
  if (profile) {
    await supabase
      .from("profiles")
      .update({ vibe_score: (profile.vibe_score ?? 0) + 5 })
      .eq("id", user.id);
  }

  // Check if user should get Bug Crusher badge
  const { count } = await supabase
    .from("bug_reports")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= 1) {
    // Upsert badge — ignore conflict if already earned
    await supabase
      .from("user_badges")
      .upsert({ user_id: user.id, badge_id: "bug_crusher" }, { onConflict: "user_id,badge_id" });
  }

  return NextResponse.json({ success: true, reportId: data.id });
}
