import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const postId = request.nextUrl.searchParams.get("postId");
    if (!postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    // Fetch post details
    const { data: post } = await supabase
      .from("posts")
      .select("id,title,views_count,cached_engagement_score")
      .eq("id", postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Fetch reaction counts
    const { data: reactions } = await supabase
      .from("reactions")
      .select("reaction_type")
      .eq("post_id", postId);

    const reactionCounts = {
      sparked: 0,
      fired_up: 0,
      bookmarked: 0,
    };
    for (const r of reactions ?? []) {
      const t = r.reaction_type as keyof typeof reactionCounts;
      if (t in reactionCounts) reactionCounts[t]++;
    }

    // Fetch proof count
    const { count: proofCount } = await supabase
      .from("impact_journal")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId);

    // Fetch comment count
    const { count: commentCount } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId);

    // Fetch report count
    const { count: reportCount } = await supabase
      .from("bug_reports")
      .select("id", { count: "exact", head: true })
      .ilike("title", `%post:${postId}%`)
      .eq("report_type", "content");

    return NextResponse.json({
      post,
      reactions: reactionCounts,
      proofCount: proofCount ?? 0,
      commentCount: commentCount ?? 0,
      reportCount: reportCount ?? 0,
    });
  } catch (error) {
    console.error("[admin/post-analytics] Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
