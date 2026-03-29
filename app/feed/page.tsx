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

  const [allPosts, challenge, provedToday] = await Promise.all([
    getPostsWithReactions(userId, 60), // Fetch more to account for filtering
    getTodaysChallenge(userId),
    userId
      ? supabase
          .from("impact_journal")
          .select("post_id")
          .eq("user_id", userId)
          .gte("created_at", todayStart)
      : Promise.resolve({ data: null }),
  ]);

  // Filter out proved reels from today (create Set for O(1) lookup)
  const provedIds = new Set<string>();
  (provedToday.data ?? []).forEach((entry: any) => {
    if (entry.post_id) {
      provedIds.add(entry.post_id);
    }
  });

  // Remove proved reels and return only unproved
  const unprovedPosts = allPosts.filter((p) => !provedIds.has(p.id));
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
