import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("id,title,category,source,is_user_created,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  // Get reported post IDs from bug_reports
  const { data: reports } = await supabase
    .from("bug_reports")
    .select("title")
    .ilike("title", "Report:%");

  const reportedPostIds = new Set(
    (reports ?? [])
      .map((r) => r.title.match(/post:([a-f0-9-]+)/)?.[1])
      .filter(Boolean)
  );

  const enriched = (posts ?? []).map((p) => ({
    ...p,
    reported: reportedPostIds.has(p.id),
  }));

  return NextResponse.json({ posts: enriched });
}

export async function DELETE(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { postId } = await request.json();
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseServiceClient() : supabase;

  // A post can be referenced by today's challenge without cascade delete.
  const { error: challengeError } = await db
    .from("daily_challenges")
    .update({ post_id: null })
    .eq("post_id", postId);

  if (challengeError) {
    return NextResponse.json({ error: challengeError.message }, { status: 500 });
  }

  const { error } = await db.from("posts").delete().eq("id", postId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { postId, title, content } = await request.json();
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;

  const { error } = await supabase.from("posts").update(updates).eq("id", postId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
