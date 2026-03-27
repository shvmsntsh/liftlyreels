import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { BottomNav } from "@/components/BottomNav";
import { ReelCard } from "@/components/ReelCard";
import { PostRecord } from "@/lib/types";
import { Bookmark } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  let savedPosts: PostRecord[] = [];

  if (userId && isSupabaseConfigured()) {
    const { data: bookmarks } = await supabase
      .from("reactions")
      .select(
        `post_id,
        posts!inner(id,title,content,category,source,image_url,author_id,is_user_created,tags,views_count,gradient,created_at,
          profiles!posts_author_id_fkey(id,username,display_name,avatar_url,vibe_score))`
      )
      .eq("user_id", userId)
      .eq("reaction_type", "bookmarked")
      .order("created_at", { ascending: false });

    if (bookmarks?.length) {
      savedPosts = bookmarks
        .map((b) => {
          const row = b.posts as unknown as Record<string, unknown>;
          if (!row) return null;
          const profileArr = row.profiles;
          const author =
            Array.isArray(profileArr) && profileArr.length > 0
              ? profileArr[0]
              : profileArr ?? null;
          return {
            id: String(row.id),
            title: String(row.title),
            content: Array.isArray(row.content) ? (row.content as string[]) : [],
            category: String(row.category),
            source: String(row.source),
            image_url: typeof row.image_url === "string" ? row.image_url : null,
            author_id: typeof row.author_id === "string" ? row.author_id : null,
            author: author as PostRecord["author"],
            is_user_created: Boolean(row.is_user_created),
            tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
            views_count: Number(row.views_count ?? 0),
            gradient: typeof row.gradient === "string" ? row.gradient : "ocean",
            created_at: String(row.created_at),
            reactions_summary: { sparked: 0, fired_up: 0, bookmarked: 0 },
            user_reactions: ["bookmarked"],
            comments_count: 0,
          } as PostRecord;
        })
        .filter(Boolean) as PostRecord[];
    }
  }

  return (
    <main className="relative mx-auto h-screen max-w-md">
      {savedPosts.length === 0 ? (
        <div className="flex h-screen items-center justify-center flex-col gap-4 px-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-sky-400/20 bg-sky-400/10">
            <Bookmark className="h-7 w-7 text-sky-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Nothing saved yet</h2>
            <p className="mt-1 text-sm text-slate-400">
              Tap 🔖 on any reel to bookmark it here.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="snap-y-mandatory h-screen overflow-y-auto">
            {savedPosts.map((post) => (
              <ReelCard key={post.id} post={post} userId={userId} />
            ))}
          </div>
        </>
      )}
      <BottomNav />
    </main>
  );
}
