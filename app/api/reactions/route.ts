import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase-server";

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

  const service = createSupabaseServiceClient();

  // Toggle reaction
  const { data: existing } = await service
    .from("reactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .eq("reaction_type", reactionType)
    .single();

  if (existing) {
    await service.from("reactions").delete().eq("id", existing.id);

    // Update author vibe score
    const { data: post } = await service
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (post?.author_id) {
      await service
        .from("profiles")
        .update({ vibe_score: service.rpc("vibe_score") })
        .eq("id", post.author_id);
    }

    return NextResponse.json({ action: "removed" });
  } else {
    await service.from("reactions").insert({
      user_id: user.id,
      post_id: postId,
      reaction_type: reactionType,
    });

    // Give author +1 vibe score
    const { data: post } = await service
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (post?.author_id && post.author_id !== user.id) {
      await service.rpc("update_user_streak", { user_uuid: post.author_id });
    }

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

  const service = createSupabaseServiceClient();

  const [{ data: all }, { data: mine }] = await Promise.all([
    service
      .from("reactions")
      .select("reaction_type")
      .eq("post_id", postId),
    service
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
