import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase-server";
import { validateProof } from "@/lib/proof-validation";
import { recomputeEngagementScore } from "@/lib/engagement-score";

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if a specific post has been proved
  const { searchParams } = new URL(request.url);
  const checkPostId = searchParams.get("postId");
  if (checkPostId) {
    const { count } = await supabase
      .from("impact_journal")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("post_id", checkPostId);
    return NextResponse.json({ proved: (count ?? 0) > 0 });
  }

  // Get today's proof count (for daily limit check)
  const dailyCountOnly = searchParams.get("dailyCount") === "true";
  const today = new Date().toISOString().slice(0, 10);
  const { count: dailyCount } = await supabase
    .from("impact_journal")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", `${today}T00:00:00.000Z`);

  if (dailyCountOnly) {
    return NextResponse.json({ count: dailyCount ?? 0 });
  }

  // Determine limit based on range parameter
  const range = searchParams.get("range");
  const limit = range === "30d" ? 150 : 20;

  const { data, error } = await supabase
    .from("impact_journal")
    .select("id,post_id,action_taken,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch post details separately (no FK join — profiles references auth.users)
  const postIds = Array.from(new Set((data ?? []).map((e) => e.post_id).filter(Boolean)));
  const postMap: Record<string, { title: string; category: string; gradient: string }> = {};
  if (postIds.length > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select("id,title,category,gradient")
      .in("id", postIds);
    for (const p of posts ?? []) {
      postMap[p.id] = { title: p.title, category: p.category, gradient: p.gradient };
    }
  }

  const entries = (data ?? []).map((e) => ({
    ...e,
    post: e.post_id ? (postMap[e.post_id] ?? null) : null,
  }));

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId, actionTaken, category: clientCategory } = await request.json();

  if (!postId || !actionTaken?.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Daily limit: max 5 proofs per day
  const today = new Date().toISOString().slice(0, 10);
  const { count: dailyCount } = await supabase
    .from("impact_journal")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", `${today}T00:00:00.000Z`);
  if ((dailyCount ?? 0) >= 5) {
    return NextResponse.json({ error: "Daily limit reached: max 5 proofs per day.", daily_limit_reached: true }, { status: 429 });
  }

  // Rate limit: max 10 proofs per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: hourlyCount } = await supabase
    .from("impact_journal")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneHourAgo);
  if ((hourlyCount ?? 0) >= 10) {
    return NextResponse.json({ error: "Rate limit: max 10 proofs per hour. Try again later." }, { status: 429 });
  }

  // Determine category for validation
  let category = clientCategory;
  if (!category) {
    const UUID_RE_CHECK = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (UUID_RE_CHECK.test(postId)) {
      const { data: postData } = await supabase.from("posts").select("category").eq("id", postId).single();
      category = postData?.category;
    }
  }

  // Server-side proof validation
  if (category) {
    const result = validateProof(actionTaken, category);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  }

  // Validate UUID format — fallback posts use string IDs like "fallback-10"
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isRealPost = UUID_RE.test(postId);

  if (isRealPost) {
    // Check if user already proved this reel — prevent duplicates
    const { count: existing } = await supabase
      .from("impact_journal")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("post_id", postId);

    if ((existing ?? 0) > 0) {
      // Already proved — return success without awarding points again
      const { count: alreadyProvedDailyCount } = await supabase
        .from("impact_journal")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00.000Z`);
      return NextResponse.json({
        entry: { id: postId },
        success: true,
        already_proved: true,
        daily_count: alreadyProvedDailyCount ?? 1,
        daily_limit_reached: (alreadyProvedDailyCount ?? 0) >= 5,
      });
    }

    const { error } = await supabase
      .from("impact_journal")
      .insert({ user_id: user.id, post_id: postId, action_taken: actionTaken.trim() })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Award +3 vibe to actor for acting on a reel
  const { data: profile } = await supabase
    .from("profiles")
    .select("vibe_score")
    .eq("id", user.id)
    .single();
  if (profile) {
    await supabase
      .from("profiles")
      .update({ vibe_score: (profile.vibe_score ?? 0) + 3 })
      .eq("id", user.id);
  }

  // Update actor's streak
  void supabase.rpc("update_user_streak", { user_uuid: user.id });

  // Side effects: notify post owner + award vibe + track category engagement (non-blocking)
  if (isRealPost) {
    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseServiceClient() : supabase;
    Promise.all([
      (async () => {
        const { data: post } = await db.from("posts").select("author_id,category").eq("id", postId).single();
        if (!post?.author_id || post.author_id === user.id) return;
        await db.from("notifications").insert({
          user_id: post.author_id,
          actor_id: user.id,
          type: "impact",
          post_id: postId,
        });
        const { data: ownerProfile } = await db.from("profiles").select("vibe_score").eq("id", post.author_id).single();
        if (ownerProfile) {
          await db.from("profiles")
            .update({ vibe_score: (ownerProfile.vibe_score ?? 0) + 2 })
            .eq("id", post.author_id);
        }
      })(),
      // Track category engagement for personalization
      (async () => {
        if (category) {
          await db.from("user_category_engagement").upsert({
            user_id: user.id,
            category,
            engagement_count: 1,
            last_engaged_at: new Date().toISOString(),
          }, { onConflict: "user_id,category" }).eq("user_id", user.id).eq("category", category);
        }
      })(),
    ]).catch(() => null);
  }

  // Return updated streak + today's proof count (for World Reel unlock)
  const [{ data: updatedProfile }, { count: newDailyCount }] = await Promise.all([
    supabase.from("profiles").select("streak_current,vibe_score").eq("id", user.id).single(),
    supabase
      .from("impact_journal")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00.000Z`),
  ]);

  const finalDailyCount = newDailyCount ?? 1;

  // Recompute engagement score (non-blocking)
  if (isRealPost) {
    void recomputeEngagementScore(postId);
  }

  return NextResponse.json({
    entry: { id: isRealPost ? postId : "local" },
    success: true,
    streak: updatedProfile?.streak_current ?? null,
    vibe: updatedProfile?.vibe_score ?? null,
    daily_count: finalDailyCount,
    daily_limit_reached: finalDailyCount >= 5,
  });
}
