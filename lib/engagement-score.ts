import { createSupabaseServiceClient } from "./supabase-server";

/**
 * Recompute engagement score for a post
 * Formula: views*0.1 + (sparked+fired_up)*2 + proofs*5 + freshness_boost
 * Freshness boost: +20 for posts < 24h old
 */
export async function recomputeEngagementScore(postId: string) {
  try {
    const db = createSupabaseServiceClient();

    // Fetch post data and counts
    const [
      { data: post },
      { count: proofCount },
      { data: reactions },
    ] = await Promise.all([
      db.from("posts").select("views_count,created_at").eq("id", postId).single(),
      db.from("impact_journal").select("id", { count: "exact", head: true }).eq("post_id", postId),
      db.from("reactions").select("reaction_type").eq("post_id", postId),
    ]);

    if (!post) return;

    // Count reactions by type
    const sparked = (reactions ?? []).filter(r => r.reaction_type === "sparked").length;
    const fired_up = (reactions ?? []).filter(r => r.reaction_type === "fired_up").length;

    // Freshness boost: posts < 24h old get +20
    const ageMs = Date.now() - new Date(post.created_at).getTime();
    const freshnessBoost = ageMs < 24 * 60 * 60 * 1000 ? 20 : 0;

    // Calculate engagement score
    const score = (post.views_count ?? 0) * 0.1
      + (sparked + fired_up) * 2
      + (proofCount ?? 0) * 5
      + freshnessBoost;

    // Update post with new score
    await db.from("posts")
      .update({ cached_engagement_score: score })
      .eq("id", postId);
  } catch (error) {
    // Non-critical, silently fail
    console.error("[engagement-score] Error recomputing score:", error);
  }
}
