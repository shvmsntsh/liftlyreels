import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { PostRecord, ProfileRecord, DailyChallenge } from "@/lib/types";
import { getFallbackPosts } from "@/utils/fallback-posts";

const POST_FIELDS = `id,title,content,category,source,image_url,author_id,is_user_created,tags,views_count,gradient,created_at`;

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

/** Fetch profiles for a set of author IDs and return a lookup map */
async function fetchAuthorProfiles(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  authorIds: string[]
): Promise<Record<string, ProfileRecord>> {
  if (!authorIds.length) return {};

  const { data } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url,vibe_score")
    .in("id", authorIds);

  const map: Record<string, ProfileRecord> = {};
  for (const p of data ?? []) {
    map[p.id] = p as ProfileRecord;
  }
  return map;
}

export async function getPosts(limit = 30): Promise<PostRecord[]> {
  const fallbackPosts = getFallbackPosts();

  if (!isSupabaseConfigured()) {
    return fallbackPosts.slice(0, limit);
  }

  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("posts")
      .select(POST_FIELDS)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("getPosts error:", error.message);
      return fallbackPosts.slice(0, limit);
    }

    if (!data?.length) {
      return fallbackPosts.slice(0, limit);
    }

    // Fetch author profiles separately (avoids FK join issues)
    const authorIds = Array.from(new Set(
      data.map((p) => p.author_id as string | null).filter((id): id is string => Boolean(id))
    ));
    const profileMap = await fetchAuthorProfiles(supabase, authorIds);

    return data.map((row) => {
      const r = row as Record<string, unknown>;
      const authorId = r.author_id as string | null;
      return normalizePost({ ...r, author: authorId ? profileMap[authorId] ?? null : null });
    });
  } catch (err) {
    console.error("getPosts unexpected error:", err);
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

    // Fetch posts without profiles join (join fails due to FK mismatch)
    const { data: posts, error } = await supabase
      .from("posts")
      .select(POST_FIELDS)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("getPostsWithReactions error:", error.message);
      return fallbackPosts.slice(0, limit);
    }

    if (!posts?.length) {
      return fallbackPosts.slice(0, limit);
    }

    const postIds = posts.map((p) => p.id);

    // Collect unique author IDs
    const authorIds = Array.from(new Set(
      posts
        .map((p) => (p as Record<string, unknown>).author_id as string | null)
        .filter((id): id is string => Boolean(id))
    ));

    const otherAuthorIds = authorIds.filter((id) => id !== userId);

    // Fetch author profiles + reactions + comments + follows in parallel
    const [profileMap, { data: allReactions }, { data: userReactions }, { data: commentCounts }, { data: userFollows }] =
      await Promise.all([
        fetchAuthorProfiles(supabase, authorIds),
        supabase
          .from("reactions")
          .select("post_id,reaction_type")
          .in("post_id", postIds),
        userId
          ? supabase
              .from("reactions")
              .select("post_id,reaction_type")
              .eq("user_id", userId)
              .in("post_id", postIds)
          : Promise.resolve({ data: [] }),
        supabase
          .from("comments")
          .select("post_id")
          .in("post_id", postIds),
        userId && otherAuthorIds.length > 0
          ? supabase
              .from("follows")
              .select("following_id")
              .eq("follower_id", userId)
              .in("following_id", otherAuthorIds)
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
      const authorId = r.author_id as string | null;
      return normalizePost({
        ...r,
        author: authorId ? profileMap[authorId] ?? null : null,
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
  } catch (err) {
    console.error("getPostsWithReactions unexpected error:", err);
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
