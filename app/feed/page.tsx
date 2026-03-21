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

  const [posts, challenge] = await Promise.all([
    getPostsWithReactions(userId, 30),
    getTodaysChallenge(userId),
  ]);

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
    <main className="relative mx-auto h-screen max-w-md overflow-hidden">
      <FeedClient initialPosts={posts} userId={userId} challenge={challenge} />
      <BottomNav streak={streak} />
    </main>
  );
}
