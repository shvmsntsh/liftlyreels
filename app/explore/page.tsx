import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { BottomNav } from "@/components/BottomNav";
import { ReelCard } from "@/components/ReelCard";
import { PostRecord } from "@/lib/types";
import { getFallbackPosts } from "@/utils/fallback-posts";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CATEGORIES = ["All", "Mindset", "Gym", "Diet", "Books", "Wellness", "Finance"];

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

  if (topIds.length > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select(
        `id,title,content,category,source,image_url,author_id,is_user_created,tags,views_count,gradient,created_at,
        profiles!posts_author_id_fkey(id,username,display_name,avatar_url,vibe_score)`
      )
      .in("id", topIds);

    if (posts?.length) {
      const [{ data: userReactions }] = await Promise.all([
        supabase
          .from("reactions")
          .select("post_id,reaction_type")
          .eq("user_id", userId)
          .in("post_id", topIds),
      ]);

      const urMap: Record<string, string[]> = {};
      for (const r of userReactions ?? []) {
        if (!urMap[r.post_id]) urMap[r.post_id] = [];
        urMap[r.post_id].push(r.reaction_type);
      }

      return posts
        .sort((a, b) => (countMap[b.id] ?? 0) - (countMap[a.id] ?? 0))
        .map((row) => {
          const r = row as Record<string, unknown>;
          const profileArr = r.profiles;
          const author =
            Array.isArray(profileArr) && profileArr.length > 0
              ? profileArr[0]
              : profileArr ?? null;
          return {
            id: String(r.id),
            title: String(r.title ?? ""),
            content: Array.isArray(r.content)
              ? (r.content as string[])
              : [],
            category: String(r.category ?? ""),
            source: String(r.source ?? ""),
            image_url: typeof r.image_url === "string" ? r.image_url : null,
            author_id: typeof r.author_id === "string" ? r.author_id : null,
            author: author as PostRecord["author"],
            is_user_created: Boolean(r.is_user_created),
            tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
            views_count: Number(r.views_count ?? 0),
            gradient: typeof r.gradient === "string" ? r.gradient : "ocean",
            created_at: String(r.created_at ?? ""),
            reactions_summary: {
              sparked: 0,
              fired_up: 0,
              bookmarked: 0,
            },
            user_reactions: urMap[r.id as string] ?? [],
            comments_count: 0,
          } as PostRecord;
        });
    }
  }

  // Fall back to most recent posts
  const { data: recent } = await supabase
    .from("posts")
    .select(
      `id,title,content,category,source,image_url,author_id,is_user_created,tags,views_count,gradient,created_at`
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (recent?.length) {
    return recent.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      content: Array.isArray(row.content) ? (row.content as string[]) : [],
      category: String(row.category),
      source: String(row.source),
      image_url: typeof row.image_url === "string" ? row.image_url : null,
      author_id: typeof row.author_id === "string" ? row.author_id : null,
      is_user_created: Boolean(row.is_user_created),
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
      views_count: Number(row.views_count ?? 0),
      gradient: typeof row.gradient === "string" ? row.gradient : "ocean",
      created_at: String(row.created_at),
      reactions_summary: { sparked: 0, fired_up: 0, bookmarked: 0 },
      user_reactions: [],
      comments_count: 0,
    } as PostRecord));
  }

  return getFallbackPosts();
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

  // Get top creators
  let topCreators: Array<{ id: string; username: string; display_name: string | null; vibe_score: number; posts_count: number }> = [];
  if (isSupabaseConfigured()) {
    const { data: creators } = await supabase
      .from("profiles")
      .select("id,username,display_name,vibe_score")
      .order("vibe_score", { ascending: false })
      .limit(5);
    topCreators = (creators ?? []).map((c) => ({ ...c, posts_count: 0 }));
  }

  return (
    <main className="relative min-h-screen bg-background pb-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_0%,rgba(139,92,246,0.1),transparent)]" />

      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto max-w-md">
          <h1 className="text-lg font-bold text-white">Explore</h1>
          <p className="text-xs text-slate-500">Trending this week</p>
        </div>
      </div>

      <div className="mx-auto max-w-md">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/explore${cat !== "All" ? `?category=${cat}` : ""}`}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                activeCategory === cat
                  ? "border-sky-400/50 bg-sky-400/15 text-sky-300"
                  : "border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Top Creators */}
        {topCreators.length > 0 && activeCategory === "All" && (
          <div className="px-4 pb-2">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Top Creators
            </p>
            <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
              {topCreators.map((creator) => {
                const initial = creator.username[0]?.toUpperCase() ?? "?";
                const colors = [
                  "bg-sky-500", "bg-violet-500", "bg-amber-500",
                  "bg-emerald-500", "bg-rose-500",
                ];
                const color = colors[creator.username.charCodeAt(0) % colors.length];
                return (
                  <Link
                    key={creator.id}
                    href={`/profile/${creator.username}`}
                    className="flex shrink-0 flex-col items-center gap-1.5 w-16"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${color} text-base font-bold text-white`}
                    >
                      {initial}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate w-full text-center">
                      {creator.display_name ?? creator.username}
                    </span>
                    <span className="text-[9px] text-amber-400">⚡ {creator.vibe_score}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Reel grid / list */}
        <div className="px-4 pt-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {activeCategory === "All" ? "Trending Reels" : `${activeCategory} Reels`}
          </p>
        </div>
      </div>

      {/* Full-screen reels */}
      <div className="snap-y-mandatory" style={{ height: "calc(100vh - 180px)", overflowY: "auto" }}>
        {filtered.map((post) => (
          <ReelCard key={post.id} post={post} userId={userId} />
        ))}
        {filtered.length === 0 && (
          <div className="flex min-h-[50vh] items-center justify-center">
            <p className="text-slate-500 text-sm">No reels in this category yet.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
