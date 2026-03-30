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
      .select("post_id,created_at")
      .eq("user_id", userId)
      .eq("reaction_type", "bookmarked")
      .order("created_at", { ascending: false });

    if (bookmarks?.length) {
      const postIds = bookmarks
        .map((bookmark) => bookmark.post_id)
        .filter((postId): postId is string => typeof postId === "string");

      const { data: posts } = await supabase
        .from("posts")
        .select("id,title,content,category,source,image_url,author_id,is_user_created,tags,views_count,gradient,audio_track,created_at")
        .in("id", postIds);

      const authorIds = Array.from(new Set(
        (posts ?? [])
          .map((post) => post.author_id)
          .filter((authorId): authorId is string => typeof authorId === "string" && authorId.length > 0)
      ));

      const { data: profiles } = authorIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id,username,display_name,avatar_url,vibe_score")
            .in("id", authorIds)
        : { data: [] };

      const profileMap = new Map(
        (profiles ?? []).map((profile) => [profile.id, profile])
      );

      const postMap = new Map(
        (posts ?? []).map((post) => [post.id, post])
      );

      // Fetch actual reaction counts
      const { data: reactionCounts } = await supabase
        .from("reactions")
        .select("post_id,reaction_type")
        .in("post_id", postIds);

      const reactionMap = new Map<string, { sparked: number; fired_up: number; bookmarked: number }>();
      for (const postId of postIds) {
        reactionMap.set(postId, { sparked: 0, fired_up: 0, bookmarked: 0 });
      }
      for (const reaction of reactionCounts ?? []) {
        const summary = reactionMap.get(String(reaction.post_id));
        if (summary && reaction.reaction_type === "sparked") summary.sparked += 1;
        if (summary && reaction.reaction_type === "fired_up") summary.fired_up += 1;
        if (summary && reaction.reaction_type === "bookmarked") summary.bookmarked += 1;
      }

      // Fetch actual comment counts
      const { data: commentCounts } = await supabase
        .from("comments")
        .select("post_id")
        .in("post_id", postIds);

      const commentMap = new Map<string, number>();
      for (const postId of postIds) {
        commentMap.set(postId, 0);
      }
      for (const comment of commentCounts ?? []) {
        const count = commentMap.get(String(comment.post_id)) ?? 0;
        commentMap.set(String(comment.post_id), count + 1);
      }

      savedPosts = postIds
        .map((postId) => {
          const row = postMap.get(postId);
          if (!row) return null;

          return {
            id: String(row.id),
            title: String(row.title),
            content: Array.isArray(row.content) ? (row.content as string[]) : [],
            category: String(row.category),
            source: String(row.source),
            image_url: typeof row.image_url === "string" ? row.image_url : null,
            author_id: typeof row.author_id === "string" ? row.author_id : null,
            author: row.author_id ? (profileMap.get(row.author_id) as PostRecord["author"] ?? null) : null,
            is_user_created: Boolean(row.is_user_created),
            tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
            views_count: Number(row.views_count ?? 0),
            gradient: typeof row.gradient === "string" ? row.gradient : "ocean",
            audio_track: typeof row.audio_track === "string" ? row.audio_track : null,
            created_at: String(row.created_at),
            reactions_summary: reactionMap.get(postId) ?? { sparked: 0, fired_up: 0, bookmarked: 0 },
            user_reactions: ["bookmarked"],
            comments_count: commentMap.get(postId) ?? 0,
          } as PostRecord;
        })
        .filter((post): post is PostRecord => post !== null);
    }
  }

  return (
    <main className="relative mx-auto h-[100dvh] max-w-md">
      {savedPosts.length === 0 ? (
        <div className="flex h-[100dvh] items-center justify-center flex-col gap-4 px-8 text-center">
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
          <div className="snap-y-mandatory h-[100dvh] overflow-y-auto">
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
