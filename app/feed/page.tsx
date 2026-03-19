import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getPostsWithReactions, getTodaysChallenge } from "@/lib/api";
import { ReelCard } from "@/components/ReelCard";
import { BottomNav } from "@/components/BottomNav";
import { DailyChallengeBar } from "@/components/DailyChallengeBar";

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
    const { data: profile } = await supabase
      .from("profiles")
      .select("streak_current")
      .eq("id", userId)
      .single();
    streak = profile?.streak_current ?? 0;
  }

  return (
    <main className="relative mx-auto h-screen max-w-md">
      <div className="snap-y-mandatory h-screen overflow-y-auto">
        {/* Daily challenge banner — first item */}
        {challenge && (
          <div className="snap-start relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
            <DailyChallengeBar challenge={challenge} fullPage />
          </div>
        )}

        {posts.map((post) => (
          <ReelCard key={post.id} post={post} userId={userId} />
        ))}

        {posts.length === 0 && (
          <div className="snap-start flex min-h-screen items-center justify-center">
            <div className="text-center text-slate-500">
              <p className="text-lg font-semibold text-white">No reels yet</p>
              <p className="mt-2 text-sm">Be the first to create one!</p>
            </div>
          </div>
        )}
      </div>

      <BottomNav streak={streak} />
    </main>
  );
}
