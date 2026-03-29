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
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // Fetch all analytics data in parallel
    const [
      { count: totalUsers },
      { count: totalPosts },
      { count: totalProofs },
      { count: totalReports },
      { data: signupsByDay },
      { data: proofsByDay },
      { data: reactionsByDay },
      { data: categoryDist },
      { data: provedCategoryDist },
      { data: topPosts },
      { data: collectorLogs },
      { data: apiErrors },
      { data: reportsByType },
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("impact_journal").select("id", { count: "exact", head: true }),
      supabase.from("bug_reports").select("id", { count: "exact", head: true }).eq("report_type", "content"),
      // Signups per day (last 30 days)
      supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", last30Days.toISOString()),
      // Proofs per day (last 30 days)
      supabase
        .from("impact_journal")
        .select("created_at")
        .gte("created_at", last30Days.toISOString()),
      // Reactions per day (last 30 days)
      supabase
        .from("reactions")
        .select("created_at")
        .gte("created_at", last30Days.toISOString()),
      // Category distribution of posts
      supabase
        .from("posts")
        .select("category")
        .not("category", "is", null),
      // Most proved categories
      supabase
        .from("impact_journal")
        .select("posts(category)"),
      // Top 20 posts by views
      supabase
        .from("posts")
        .select("id,title,category,views_count,cached_engagement_score")
        .order("views_count", { ascending: false })
        .limit(20),
      // Last 10 collector runs
      supabase
        .from("content_collection_log")
        .select("run_at,items_collected,items_deleted,sources_summary,errors,triggered_by")
        .order("run_at", { ascending: false })
        .limit(10),
      // Last 10 API errors
      supabase
        .from("api_errors")
        .select("endpoint,status_code,created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      // Bug reports by type
      supabase
        .from("bug_reports")
        .select("report_type")
        .in("report_type", ["bug", "content"]),
    ]);

    // Process signups by day
    const signupsByDateMap: Record<string, number> = {};
    for (const p of signupsByDay ?? []) {
      const day = p.created_at.slice(0, 10);
      signupsByDateMap[day] = (signupsByDateMap[day] ?? 0) + 1;
    }

    // Process proofs by day
    const proofsByDateMap: Record<string, number> = {};
    for (const p of proofsByDay ?? []) {
      const day = p.created_at.slice(0, 10);
      proofsByDateMap[day] = (proofsByDateMap[day] ?? 0) + 1;
    }

    // Process reactions by day
    const reactionsByDateMap: Record<string, number> = {};
    for (const r of reactionsByDay ?? []) {
      const day = r.created_at.slice(0, 10);
      reactionsByDateMap[day] = (reactionsByDateMap[day] ?? 0) + 1;
    }

    // Category distribution
    const categoryDistMap: Record<string, number> = {};
    for (const p of categoryDist ?? []) {
      const cat = p.category ?? "Unknown";
      categoryDistMap[cat] = (categoryDistMap[cat] ?? 0) + 1;
    }

    // Proved categories distribution
    const provedCatMap: Record<string, number> = {};
    for (const entry of provedCategoryDist ?? []) {
      const cat = (entry as any).posts?.category ?? "Unknown";
      provedCatMap[cat] = (provedCatMap[cat] ?? 0) + 1;
    }

    // Aggregate reaction counts
    let totalReacted = 0;
    for (const r of reactionsByDay ?? []) {
      totalReacted++;
    }

    // Today's stats
    const today = new Date().toISOString().slice(0, 10);
    const todayProofs = Object.entries(proofsByDateMap)
      .filter(([day]) => day === today)
      .reduce((sum, [_, count]) => sum + count, 0);
    const todayReactions = Object.entries(reactionsByDateMap)
      .filter(([day]) => day === today)
      .reduce((sum, [_, count]) => sum + count, 0);
    const todaySignups = Object.entries(signupsByDateMap)
      .filter(([day]) => day === today)
      .reduce((sum, [_, count]) => sum + count, 0);

    // Average 7-day stats
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const proofsLast7 = Object.entries(proofsByDateMap)
      .filter(([day]) => day >= last7Days.toISOString().slice(0, 10))
      .reduce((sum, [_, count]) => sum + count, 0);
    const avgProofsPer7d = (proofsLast7 / 7).toFixed(1);

    // Bug report severity
    const bugsOpen = await supabase
      .from("bug_reports")
      .select("severity")
      .eq("status", "open")
      .eq("report_type", "bug");

    const bugSeverity: Record<string, number> = {};
    for (const b of bugsOpen.data ?? []) {
      bugSeverity[b.severity] = (bugSeverity[b.severity] ?? 0) + 1;
    }

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers ?? 0,
        totalPosts: totalPosts ?? 0,
        totalProofs: totalProofs ?? 0,
        totalReports: totalReports ?? 0,
      },
      today: {
        proofs: todayProofs,
        reactions: todayReactions,
        signups: todaySignups,
      },
      averages: {
        proofsPerDay: avgProofsPer7d,
      },
      charts: {
        signupsByDay: signupsByDateMap,
        proofsByDay: proofsByDateMap,
        reactionsByDay: reactionsByDateMap,
        categoryDistribution: categoryDistMap,
        provedCategories: provedCatMap,
      },
      topPosts: topPosts ?? [],
      collectorLogs: collectorLogs ?? [],
      apiErrors: apiErrors ?? [],
      bugSeverity,
    });
  } catch (error) {
    console.error("[admin/analytics] Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
