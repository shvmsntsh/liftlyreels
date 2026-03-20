import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId, reactionType } = await request.json();

  if (!postId || !["sparked", "fired_up", "bookmarked"].includes(reactionType)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Toggle reaction
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .eq("reaction_type", reactionType)
    .single();

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);

    return NextResponse.json({ action: "removed" });
  } else {
    await supabase.from("reactions").insert({
      user_id: user.id,
      post_id: postId,
      reaction_type: reactionType,
    });

    // Update streak for current user when they react
    await supabase.rpc("update_user_streak", { user_uuid: user.id });

    return NextResponse.json({ action: "added" });
  }
}

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const postId = request.nextUrl.searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  const [{ data: all }, { data: mine }] = await Promise.all([
    supabase
      .from("reactions")
      .select("reaction_type")
      .eq("post_id", postId),
    supabase
      .from("reactions")
      .select("reaction_type")
      .eq("post_id", postId)
      .eq("user_id", user.id),
  ]);

  const summary = { sparked: 0, fired_up: 0, bookmarked: 0 };
  for (const r of all ?? []) {
    const t = r.reaction_type as keyof typeof summary;
    if (t in summary) summary[t]++;
  }

  return NextResponse.json({
    summary,
    userReactions: (mine ?? []).map((r) => r.reaction_type),
  });
}
