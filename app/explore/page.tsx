import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { BottomNav } from "@/components/BottomNav";
import { ReelCard } from "@/components/ReelCard";
import { PostRecord, ProfileRecord } from "@/lib/types";
import { getFallbackPosts } from "@/utils/fallback-posts";
import Link from "next/link";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

const CATEGORIES = ["All", "Mindset", "Gym", "Diet", "Books", "Wellness", "Finance"];
const POST_FIELDS = `id,title,content,category,source,image_url,author_id,is_user_created,tags,views_count,gradient,audio_track,created_at`;

function normalizeRow(row: Record<string, unknown>): PostRecord {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    content: Array.isArray(row.content) ? (row.content as string[]) : [],
    category: String(row.category ?? ""),
    source: String(row.source ?? ""),
    image_url: typeof row.image_url === "string" ? row.image_url : null,
    author_id: typeof row.author_id === "string" ? row.author_id : null,
    author: (row.author as ProfileRecord | null) ?? null,
    is_user_created: Boolean(row.is_user_created),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    views_count: Number(row.views_count ?? 0),
    gradient: typeof row.gradient === "string" ? row.gradient : "ocean",
    audio_track: typeof row.audio_track === "string" ? row.audio_track : null,
    created_at: String(row.created_at ?? ""),
    reactions_summary: { sparked: 0, fired_up: 0, bookmarked: 0 },
    user_reactions: (row.user_reactions ?? []) as PostRecord["user_reactions"],
    comments_count: 0,
    author_is_following: Boolean(row.author_is_following),
  };
}

async function getTrendingPosts(userId: string): Promise<PostRecord[]> {
  if (!isSupabaseConfigured()) return getFallbackPosts();

  const supabase = createSupabaseServerClient();

  // Get post IDs with most reactions in last 7 days
  const { data: trending } = await supabase
    .from("reactions")
    .select("post_id")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const countMap: Record<string, number> = {};
  for (const r of trending ?? []) {
    countMap[r.post_id] = (countMap[r.post_id] ?? 0) + 1;
  }

  const topIds = Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([id]) => id);

  let rawPosts: Record<string, unknown>[] | null = null;

  if (topIds.length > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select(POST_FIELDS)
      .in("id", topIds);

    if (posts?.length) {
      rawPosts = posts
        .sort((a, b) => (countMap[b.id] ?? 0) - (countMap[a.id] ?? 0)) as unknown as Record<string, unknown>[];
    }
  }

  // Fall back to most recent posts if no trending
  if (!rawPosts) {
    const { data: recent } = await supabase
      .from("posts")
      .select(POST_FIELDS)
      .order("created_at", { ascending: false })
      .limit(20);

    if (recent?.length) {
      rawPosts = recent as unknown as Record<string, unknown>[];
    }
  }

  if (!rawPosts?.length) return getFallbackPosts();

  // Fetch author profiles separately
  const allAuthorIds = Array.from(new Set(
    rawPosts.map((p) => p.author_id as string | null).filter((id): id is string => Boolean(id))
  ));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url,vibe_score")
    .in("id", allAuthorIds.length > 0 ? allAuthorIds : ["__none__"]);

  const profileMap: Record<string, ProfileRecord> = {};
  for (const p of profiles ?? []) {
    profileMap[p.id] = p as ProfileRecord;
  }

  // Fetch user reactions & follow states
  const postIds = rawPosts.map((p) => String(p.id));
  const otherAuthorIds = allAuthorIds.filter((id) => id !== userId);

  const [{ data: userReactions }, { data: userFollows }] = await Promise.all([
    userId
      ? supabase
          .from("reactions")
          .select("post_id,reaction_type")
          .eq("user_id", userId)
          .in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    userId && otherAuthorIds.length > 0
      ? supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", userId)
          .in("following_id", otherAuthorIds)
      : Promise.resolve({ data: [] }),
  ]);

  const urMap: Record<string, string[]> = {};
  for (const r of userReactions ?? []) {
    if (!urMap[r.post_id]) urMap[r.post_id] = [];
    urMap[r.post_id].push(r.reaction_type);
  }

  const followingSet = new Set(
    (userFollows ?? []).map((f) => (f as Record<string, unknown>).following_id as string)
  );

  return rawPosts.map((row) => {
    const id = String(row.id);
    const authorId = row.author_id as string | null;
    return normalizeRow({
      ...row,
      author: authorId ? profileMap[authorId] ?? null : null,
      user_reactions: urMap[id] ?? [],
      author_is_following: authorId ? followingSet.has(authorId) : false,
    });
  });
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const activeCategory = searchParams?.category ?? "All";
  const allPosts = await getTrendingPosts(userId);

  const filtered =
    activeCategory === "All"
      ? allPosts
      : allPosts.filter((p) => p.category === activeCategory);

  return (
    <main className="relative mx-auto h-[100dvh] max-w-md overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/70 via-black/40 to-transparent pb-8 pt-4">
        <div className="pointer-events-auto flex items-center justify-between px-4 pb-2">
          <div>
            <h1 className="text-lg font-bold text-white">Explore</h1>
            <p className="text-xs text-slate-400">Trending this week</p>
          </div>
          <Link
            href="/search"
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 backdrop-blur-md"
          >
            <Search className="h-3.5 w-3.5 text-white/70" />
            <span className="text-xs text-white/50">Search</span>
          </Link>
        </div>
        <div className="pointer-events-auto flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/explore${cat !== "All" ? `?category=${cat}` : ""}`}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold backdrop-blur-md transition ${
                activeCategory === cat
                  ? "border-sky-400/50 bg-sky-400/20 text-sky-300"
                  : "border-white/15 bg-white/5 text-slate-300 hover:text-white"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      <div className="h-[100dvh] overflow-y-auto snap-y-mandatory scrollbar-none feed-scroll">
        {filtered.map((post) => (
          <ReelCard key={post.id} post={post} userId={userId} />
        ))}
        {filtered.length === 0 && (
          <div className="snap-start flex h-[100dvh] items-center justify-center">
            <p className="text-slate-500 text-sm">No reels in this category yet.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
