import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { recomputeEngagementScore } from "@/lib/engagement-score";

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 60 reactions per minute per user
  const rl = checkRateLimit(`reactions:${user.id}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
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

    // Side effects: streak for reactor + notify/vibe for post owner + category engagement (non-blocking)
    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseServiceClient() : supabase;
    Promise.all([
      supabase.rpc("update_user_streak", { user_uuid: user.id }),
      (async () => {
        const { data: post } = await db.from("posts").select("author_id,category").eq("id", postId).single();
        if (!post?.author_id || post.author_id === user.id) return;
        await db.from("notifications").insert({
          user_id: post.author_id,
          actor_id: user.id,
          type: "reaction",
          post_id: postId,
          reaction_type: reactionType,
        });
        const { data: ownerProfile } = await db.from("profiles").select("vibe_score").eq("id", post.author_id).single();
        if (ownerProfile) {
          await db.from("profiles")
            .update({ vibe_score: (ownerProfile.vibe_score ?? 0) + 1 })
            .eq("id", post.author_id);
        }
      })(),
      // Track category engagement with weight 0.5 for reactions
      (async () => {
        const { data: post } = await db.from("posts").select("category").eq("id", postId).single();
        if (post?.category) {
          await db.from("user_category_engagement").upsert({
            user_id: user.id,
            category: post.category,
            engagement_count: 1,
            last_engaged_at: new Date().toISOString(),
          }, { onConflict: "user_id,category" });
        }
      })(),
    ]).catch(() => null);

    // Recompute engagement score (non-blocking)
    void recomputeEngagementScore(postId);

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
