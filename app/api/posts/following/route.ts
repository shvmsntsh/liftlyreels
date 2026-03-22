import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const POST_FIELDS = `id,title,content,category,source,image_url,author_id,is_user_created,tags,views_count,gradient,audio_track,created_at`;

export async function GET() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = (follows ?? []).map((f) => f.following_id as string);

  if (followingIds.length === 0) {
    return NextResponse.json({ posts: [] });
  }

  const { data: posts, error } = await supabase
    .from("posts")
    .select(POST_FIELDS)
    .in("author_id", followingIds)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !posts?.length) {
    return NextResponse.json({ posts: [] });
  }

  // Fetch author profiles separately
  const authorIds = Array.from(new Set(posts.map((p) => p.author_id as string).filter(Boolean)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url,vibe_score")
    .in("id", authorIds);

  const profileMap: Record<string, unknown> = {};
  for (const p of profiles ?? []) {
    profileMap[p.id] = p;
  }

  const postIds = posts.map((p) => p.id);
  const [{ data: userReactions }, { data: commentCounts }] = await Promise.all([
    supabase
      .from("reactions")
      .select("post_id,reaction_type")
      .eq("user_id", user.id)
      .in("post_id", postIds),
    supabase.from("comments").select("post_id").in("post_id", postIds),
  ]);

  const urMap: Record<string, string[]> = {};
  for (const r of userReactions ?? []) {
    if (!urMap[r.post_id]) urMap[r.post_id] = [];
    urMap[r.post_id].push(r.reaction_type);
  }

  const ccMap: Record<string, number> = {};
  for (const c of commentCounts ?? []) {
    ccMap[c.post_id] = (ccMap[c.post_id] ?? 0) + 1;
  }

  const normalized = posts.map((row) => {
    const r = row as Record<string, unknown>;
    const authorId = r.author_id as string | null;
    return {
      id: String(r.id),
      title: String(r.title ?? ""),
      content: Array.isArray(r.content) ? r.content : [],
      category: String(r.category ?? ""),
      source: String(r.source ?? ""),
      image_url: typeof r.image_url === "string" ? r.image_url : null,
      author_id: authorId,
      author: authorId ? profileMap[authorId] ?? null : null,
      is_user_created: Boolean(r.is_user_created),
      tags: Array.isArray(r.tags) ? r.tags : [],
      views_count: Number(r.views_count ?? 0),
      gradient: typeof r.gradient === "string" ? r.gradient : "ocean",
      audio_track: typeof r.audio_track === "string" ? r.audio_track : null,
      created_at: String(r.created_at ?? ""),
      reactions_summary: { sparked: 0, fired_up: 0, bookmarked: 0 },
      user_reactions: urMap[String(r.id)] ?? [],
      comments_count: ccMap[String(r.id)] ?? 0,
      author_is_following: true,
    };
  });

  return NextResponse.json({ posts: normalized });
}
