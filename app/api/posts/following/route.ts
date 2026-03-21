import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const POSTS_SELECT_WITH_AUTHOR = `id,title,content,category,source,image_url,author_id,is_user_created,tags,views_count,gradient,created_at,
  profiles(id,username,display_name,avatar_url,vibe_score)`;
const POSTS_SELECT_PLAIN = `id,title,content,category,source,image_url,author_id,is_user_created,tags,views_count,gradient,created_at`;

export async function GET() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get IDs of users this person follows
  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = (follows ?? []).map((f) => f.following_id as string);

  if (followingIds.length === 0) {
    return NextResponse.json({ posts: [] });
  }

  // Get posts from followed users
  let { data: postsRaw, error: postsError } = await supabase
    .from("posts")
    .select(POSTS_SELECT_WITH_AUTHOR)
    .in("author_id", followingIds)
    .order("created_at", { ascending: false })
    .limit(30);

  // Fallback if join fails
  if (postsError) {
    const retry = await supabase
      .from("posts")
      .select(POSTS_SELECT_PLAIN)
      .in("author_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(30);
    postsRaw = retry.data as typeof postsRaw;
  }

  const posts = postsRaw;

  if (!posts?.length) {
    return NextResponse.json({ posts: [] });
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
    const profileArr = r.profiles;
    const author =
      Array.isArray(profileArr) && profileArr.length > 0
        ? profileArr[0]
        : profileArr && typeof profileArr === "object"
        ? profileArr
        : null;

    return {
      id: String(r.id),
      title: String(r.title ?? ""),
      content: Array.isArray(r.content) ? r.content : [],
      category: String(r.category ?? ""),
      source: String(r.source ?? ""),
      image_url: typeof r.image_url === "string" ? r.image_url : null,
      author_id: typeof r.author_id === "string" ? r.author_id : null,
      author,
      is_user_created: Boolean(r.is_user_created),
      tags: Array.isArray(r.tags) ? r.tags : [],
      views_count: Number(r.views_count ?? 0),
      gradient: typeof r.gradient === "string" ? r.gradient : "ocean",
      created_at: String(r.created_at ?? ""),
      reactions_summary: { sparked: 0, fired_up: 0, bookmarked: 0 },
      user_reactions: urMap[String(r.id)] ?? [],
      comments_count: ccMap[String(r.id)] ?? 0,
      author_is_following: true,
    };
  });

  return NextResponse.json({ posts: normalized });
}
