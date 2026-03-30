import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { POST_FIELDS, hydratePostsWithContext } from "@/lib/api";

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all proved post IDs (not just today's)
    const { data: proveData } = await supabase
      .from("impact_journal")
      .select("post_id")
      .eq("user_id", user.id);

    const provedPostIds = (proveData ?? []).map((p) => p.post_id).filter(Boolean);

    // Get user's top categories (sorted by engagement count descending)
    const { data: categoryData } = await supabase
      .from("user_category_engagement")
      .select("category,engagement_count")
      .eq("user_id", user.id)
      .order("engagement_count", { ascending: false });

    const userTopCategories = (categoryData ?? []).map((c) => c.category);

    // Fetch a broad candidate set, then rank before trimming so category preference can matter.
    const { data: allPosts, error } = await supabase
      .from("posts")
      .select(`${POST_FIELDS},cached_engagement_score`)
      .order("cached_engagement_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(150);

    if (error || !allPosts) {
      return NextResponse.json({ posts: [] });
    }

    // Filter out proved posts in JavaScript
    const provedSet = new Set(provedPostIds);
    const candidatePosts = allPosts.filter((post) => !provedSet.has(post.id));

    // Sort posts: first by user's top categories, then by engagement score
    const categoryRank: Record<string, number> = {};
    userTopCategories.forEach((cat, idx) => {
      categoryRank[cat] = idx;
    });

    const sortedCandidates = candidatePosts.sort((a, b) => {
      const aRank = categoryRank[a.category] ?? 999;
      const bRank = categoryRank[b.category] ?? 999;

      // Primary sort: category rank (user's top categories first)
      if (aRank !== bRank) return aRank - bRank;

      // Secondary sort: engagement score (highest first)
      const aScore = a.cached_engagement_score ?? 0;
      const bScore = b.cached_engagement_score ?? 0;
      if (aScore !== bScore) return bScore - aScore;

      // Tertiary sort: freshness (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const hydratedPosts = await hydratePostsWithContext(
      supabase,
      sortedCandidates
        .slice(0, 30)
        .map((post) => post as unknown as Record<string, unknown>),
      user.id
    );

    return NextResponse.json({ posts: hydratedPosts });
  } catch (error) {
    console.error("[feed/personalized] Error:", error);
    return NextResponse.json({ posts: [] });
  }
}
