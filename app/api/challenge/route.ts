import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { challengeId, note } = await request.json();

  if (!challengeId) {
    return NextResponse.json({ error: "Missing challengeId" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();

  // Check if already completed
  const { data: existing } = await service
    .from("challenge_completions")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("challenge_id", challengeId)
    .single();

  if (existing) {
    return NextResponse.json({ alreadyCompleted: true });
  }

  // Insert completion
  const { error } = await service.from("challenge_completions").insert({
    user_id: user.id,
    challenge_id: challengeId,
    note: note?.trim() || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Manually increment completions count
  const { data: challenge } = await service
    .from("daily_challenges")
    .select("completions_count")
    .eq("id", challengeId)
    .single();

  if (challenge) {
    await service
      .from("daily_challenges")
      .update({ completions_count: (challenge.completions_count ?? 0) + 1 })
      .eq("id", challengeId);
  }

  // Reward +2 vibe score for completing a challenge
  const { data: profile } = await service
    .from("profiles")
    .select("vibe_score")
    .eq("id", user.id)
    .single();

  if (profile) {
    await service
      .from("profiles")
      .update({ vibe_score: (profile.vibe_score ?? 0) + 2 })
      .eq("id", user.id);
  }

  return NextResponse.json({ success: true });
}
