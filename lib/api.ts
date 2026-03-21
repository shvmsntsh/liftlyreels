import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { PostRecord, ProfileRecord, DailyChallenge } from "@/lib/types";
import { getFallbackPosts } from "@/utils/fallback-posts";

function normalizePost(row: Record<string, unknown>): PostRecord {
  const content = Array.isArray(row.content)
    ? row.content.filter((item): item is string => typeof item === "string")
    : [];

  return {
    id: String(row.id),
    title: String(row.title ?? "Untitled"),
    content,
    category: String(row.category ?? "General"),
    source: String(row.source ?? "Liftly"),
    image_url: typeof row.image_url === "string" ? row.image_url : null,
    author_id: typeof row.author_id === "string" ? row.author_id : null,
    author: (row.author as ProfileRecord | null) ?? null,
    is_user_created: Boolean(row.is_user_created),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    views_count: Number(row.views_count ?? 0),
    gradient: typeof row.gradient === "string" ? row.gradient : "ocean",
    created_at: String(row.created_at ?? new Date().toISOString()),
    reactions_summary: row.reactions_summary as PostRecord["reactions_summary"],
    user_reactions: Array.isArray(row.user_reactions)
      ? (row.user_reactions as PostRecord["user_reactions"])
      : [],
    comments_count: Number(row.comments_count ?? 0),
    author_is_following: Boolean(row.author_is_following),
  };
}

export async function getPosts(limit = 30): Promise<PostRecord[]> {
  const fallbackPosts = getFallbackPosts();

  if (!isSupabaseConfigured()) {
    return fallbackPosts.slice(0, limit);
  }

  try {
    const supabase = createSupabaseServerClient();

    // Try with profiles join first
    let { data, error } = await supabase
      .from("posts")
      .select(
        `id,title,content,category,source,image_url,author_id,is_user_created,tags,views_count,gradient,created_at,
        profiles(id,username,display_name,avatar_url,vibe_score)`
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    // If join fails (FK mismatch), retry without it
    if (error) {
      console.error("getPosts join error, retrying without join:", error.message);
      const retry = await supabase
        .from("posts")
        .select(`id,title,content,category,source,image_url,author_id,is_user_created,tags,views_count,gradient,created_at`)
        .order("created_at", { ascending: false })
        .limit(limit);
      data = retry.data as typeof data;
      error = retry.error;
    }

    if (error || !data?.length) {
      return fallbackPosts.slice(0, limit);
    }

    return data.map((row) => {
      const r = row as Record<string, unknown>;
      const profileArr = r.profiles;
      const author =
        Array.isArray(profileArr) && profileArr.length > 0
          ? (profileArr[0] as ProfileRecord)
          : profileArr && typeof profileArr === "object"
          ? (profileArr as ProfileRecord)
          : null;
      return normalizePost({ ...r, author });
    });
  } catch {
    return fallbackPosts.slice(0, limit);
  }
}

export async function getPostsWithReactions(
  userId: string,
  limit = 30
): Promise<PostRecord[]> {
  const fallbackPosts = getFallbackPosts();

  if (!isSupabaseConfigured()) {
    return fallbackPosts.slice(0, limit);
  }

  try {
    const supabase = createSupabaseServerClient();

    // Try with profiles join first
    let { data: posts, error } = await supabase
      .from("posts")
      .select(
        `id,title,content,category,source,image_url,author_id,is_user_created,tags,views_count,gradient,created_at,
        profiles(id,username,display_name,avatar_url,vibe_score)`
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    // If join fails, retry without it
    if (error) {
      console.error("getPostsWithReactions join error, retrying:", error.message);
      const retry = await supabase
        .from("posts")
        .select(`id,title,content,category,source,image_url,author_id,is_user_created,tags,views_count,gradient,created_at`)
        .order("created_at", { ascending: false })
        .limit(limit);
      posts = retry.data as typeof posts;
      error = retry.error;
    }

    if (error || !posts?.length) {
      return fallbackPosts.slice(0, limit);
    }

    const postIds = posts.map((p) => p.id);

    // Collect unique author IDs for follow state lookup
    const authorIds = Array.from(
      new Set(
        posts
          .map((p) => (p as Record<string, unknown>).author_id as string | null)
          .filter((id): id is string => Boolean(id) && id !== userId)
      )
    );

    const [{ data: allReactions }, { data: userReactions }, { data: commentCounts }, { data: userFollows }] =
      await Promise.all([
        supabase
          .from("reactions")
          .select("post_id,reaction_type")
          .in("post_id", postIds),
        supabase
          .from("reactions")
          .select("post_id,reaction_type")
          .eq("user_id", userId)
          .in("post_id", postIds),
        supabase
          .from("comments")
          .select("post_id")
          .in("post_id", postIds),
        userId && authorIds.length > 0
          ? supabase
              .from("follows")
              .select("following_id")
              .eq("follower_id", userId)
              .in("following_id", authorIds)
          : Promise.resolve({ data: [] }),
      ]);

    const reactionsMap: Record<string, { sparked: number; fired_up: number; bookmarked: number }> =
      {};
    for (const r of allReactions ?? []) {
      if (!reactionsMap[r.post_id]) {
        reactionsMap[r.post_id] = { sparked: 0, fired_up: 0, bookmarked: 0 };
      }
      const type = r.reaction_type as keyof typeof reactionsMap[string];
      if (type in reactionsMap[r.post_id]) {
        reactionsMap[r.post_id][type]++;
      }
    }

    const userReactionsMap: Record<string, string[]> = {};
    for (const r of userReactions ?? []) {
      if (!userReactionsMap[r.post_id]) userReactionsMap[r.post_id] = [];
      userReactionsMap[r.post_id].push(r.reaction_type);
    }

    const commentsCountMap: Record<string, number> = {};
    for (const c of commentCounts ?? []) {
      commentsCountMap[c.post_id] = (commentsCountMap[c.post_id] ?? 0) + 1;
    }

    const followingSet = new Set(
      (userFollows ?? []).map((f) => (f as Record<string, unknown>).following_id as string)
    );

    return posts.map((row) => {
      const r = row as Record<string, unknown>;
      const profileArr = r.profiles;
      const author =
        Array.isArray(profileArr) && profileArr.length > 0
          ? (profileArr[0] as ProfileRecord)
          : profileArr && typeof profileArr === "object"
          ? (profileArr as ProfileRecord)
          : null;

      const authorId = r.author_id as string | null;
      return normalizePost({
        ...r,
        author,
        reactions_summary: reactionsMap[r.id as string] ?? {
          sparked: 0,
          fired_up: 0,
          bookmarked: 0,
        },
        user_reactions: userReactionsMap[r.id as string] ?? [],
        comments_count: commentsCountMap[r.id as string] ?? 0,
        author_is_following: authorId ? followingSet.has(authorId) : false,
      });
    });
  } catch {
    return fallbackPosts.slice(0, limit);
  }
}

export async function getTodaysChallenge(
  userId?: string
): Promise<DailyChallenge | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = createSupabaseServerClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("daily_challenges")
      .select("*")
      .eq("date", today)
      .single();

    if (error || !data) return null;

    let userCompleted = false;
    if (userId) {
      const { data: completion } = await supabase
        .from("challenge_completions")
        .select("user_id")
        .eq("user_id", userId)
        .eq("challenge_id", data.id)
        .single();
      userCompleted = Boolean(completion);
    }

    return { ...(data as DailyChallenge), user_completed: userCompleted };
  } catch {
    return null;
  }
}

export async function getProfile(userId: string): Promise<ProfileRecord | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = isSupabaseConfigured()
      ? getSupabaseClient()
      : null;
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) return null;
    return data as ProfileRecord;
  } catch {
    return null;
  }
}

export async function getProfileByUsername(
  username: string
): Promise<ProfileRecord | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !data) return null;
    return data as ProfileRecord;
  } catch {
    return null;
  }
}
