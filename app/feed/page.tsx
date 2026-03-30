import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getPostsWithReactions, getTodaysChallenge } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";
import { FeedClient } from "@/components/FeedClient";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? "";

  // Get today's date in UTC (YYYY-MM-DD)
  const now = new Date();
  const todayUTC = now.toISOString().split('T')[0];
  const todayStart = `${todayUTC}T00:00:00.000Z`;

  // Always fetch enough posts to ensure we have 30 unproved after filtering
  const [allPosts, challenge, provedData] = await Promise.all([
    getPostsWithReactions(userId, 100), // Fetch 100 to account for filtering
    getTodaysChallenge(userId),
    userId
      ? supabase
          .from("impact_journal")
          .select("post_id")
          .eq("user_id", userId)
      : Promise.resolve({ data: [] }),
  ]);

  // Build Set of proved post IDs for this user today
  const provedPostIds = new Set<string>();
  if (provedData.data) {
    provedData.data.forEach((entry: any) => {
      if (entry?.post_id) {
        provedPostIds.add(String(entry.post_id));
      }
    });
  }

  // Filter: Keep ONLY unproved posts, return first 30
  const unprovedPosts = allPosts.filter((post) => {
    const postId = String(post.id);
    return !provedPostIds.has(postId);
  });

  const posts = unprovedPosts.slice(0, 30);

  // Get streak from profile
  let streak = 0;
  if (userId) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak_current")
        .eq("id", userId)
        .single();
      streak = profile?.streak_current ?? 0;
    } catch {
      streak = 0;
    }
  }

  return (
    <main className="relative mx-auto h-[100dvh] max-w-md overflow-hidden">
      <FeedClient initialPosts={posts} userId={userId} challenge={challenge} />
      <BottomNav streak={streak} />
    </main>
  );
}
