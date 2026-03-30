import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all proved post IDs (all time, not just today's)
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

    // Fetch all posts, then filter out proved ones
    const { data: allPosts, error } = await supabase
      .from("posts")
      .select(
        `
        id,
        title,
        content,
        category,
        gradient,
        source,
        is_user_created,
        author_id,
        created_at,
        views_count,
        cached_engagement_score
        `
      )
      .order("cached_engagement_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100); // Fetch more to account for filtering

    if (error || !allPosts) {
      return NextResponse.json({ posts: [] });
    }

    // Filter out proved posts in JavaScript
    const provedSet = new Set(provedPostIds);
    const posts = allPosts.filter((p) => !provedSet.has(p.id)).slice(0, 30);

    // Sort posts: first by user's top categories, then by engagement score
    const categoryRank: Record<string, number> = {};
    userTopCategories.forEach((cat, idx) => {
      categoryRank[cat] = idx;
    });

    const sortedPosts = posts.sort((a, b) => {
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

    return NextResponse.json({ posts: sortedPosts });
  } catch (error) {
    console.error("[feed/personalized] Error:", error);
    return NextResponse.json({ posts: [] });
  }
}
