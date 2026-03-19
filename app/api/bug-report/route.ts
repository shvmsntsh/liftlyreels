import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase-server";

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

  const service = createSupabaseServiceClient();

  const { data, error } = await service
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
  await service
    .from("profiles")
    .select("vibe_score")
    .eq("id", user.id)
    .single()
    .then(({ data: profile }) => {
      if (profile) {
        service
          .from("profiles")
          .update({ vibe_score: (profile.vibe_score ?? 0) + 5 })
          .eq("id", user.id);
      }
    });

  // Check if user should get Bug Crusher badge
  const { count } = await service
    .from("bug_reports")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= 1) {
    // Upsert badge — ignore conflict if already earned
    void service
      .from("user_badges")
      .upsert({ user_id: user.id, badge_id: "bug_crusher" }, { onConflict: "user_id,badge_id" });
  }

  return NextResponse.json({ success: true, reportId: data.id });
}
