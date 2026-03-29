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
    // Fetch all content reports (filtered by report_type = 'content')
    const { data: reports, error } = await supabase
      .from("bug_reports")
      .select("id,title,description,severity,status,created_at,user_id")
      .eq("report_type", "content")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse post IDs from titles and fetch post details
    const postMap: Record<string, any> = {};
    const postIds: string[] = [];

    for (const report of reports ?? []) {
      // Extract post ID from title pattern "Content Report: ... post:<uuid>"
      const match = report.title.match(/post:([a-f0-9-]+)/i);
      if (match) {
        postIds.push(match[1]);
      }
    }

    if (postIds.length > 0) {
      const { data: posts } = await supabase
        .from("posts")
        .select("id,title,category,author_id")
        .in("id", postIds);

      for (const post of posts ?? []) {
        postMap[post.id] = post;
      }
    }

    // Enrich reports with post details
    const enrichedReports = (reports ?? []).map((report) => {
      const match = report.title.match(/post:([a-f0-9-]+)/i);
      const postId = match?.[1];
      const post = postId ? postMap[postId] : null;

      return {
        ...report,
        post,
      };
    });

    return NextResponse.json({ reports: enrichedReports });
  } catch (error) {
    console.error("[admin/reports] Error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { reportId, status } = await request.json();

    if (!reportId || !["open", "triaging", "fixed", "wontfix"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { error } = await supabase
      .from("bug_reports")
      .update({ status })
      .eq("id", reportId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/reports] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
