import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("impact_journal")
    .select("id,post_id,action_taken,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

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

  const { postId, actionTaken } = await request.json();

  if (!postId || !actionTaken?.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Validate UUID format — fallback posts use string IDs like "fallback-10"
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isRealPost = UUID_RE.test(postId);

  if (isRealPost) {
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

  // Side effects: notify post owner + award vibe to post owner (non-blocking)
  if (isRealPost) {
    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseServiceClient() : supabase;
    Promise.all([
      (async () => {
        const { data: post } = await db.from("posts").select("author_id").eq("id", postId).single();
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
    ]).catch(() => null);
  }

  // Return updated streak for milestone detection
  const { data: updatedProfile } = await supabase
    .from("profiles")
    .select("streak_current,vibe_score")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    entry: { id: isRealPost ? postId : "local" },
    success: true,
    streak: updatedProfile?.streak_current ?? null,
    vibe: updatedProfile?.vibe_score ?? null,
  });
}
