import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  // Auth check via cookie session
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const postId = request.nextUrl.searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  // Use service client to bypass RLS reliably
  const db = createSupabaseServiceClient();

  const { data, error } = await db
    .from("comments")
    .select("id,user_id,post_id,content,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const comments = data ?? [];
  const userIds = Array.from(new Set(comments.map((c) => c.user_id)));
  const profilesMap: Record<string, { id: string; username: string; display_name: string | null; avatar_url: string | null }> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from("profiles")
      .select("id,username,display_name,avatar_url")
      .in("id", userIds);
    for (const p of profiles ?? []) profilesMap[p.id] = p;
  }

  const enriched = comments.map((c) => ({
    ...c,
    profile: profilesMap[c.user_id] ?? { id: c.user_id, username: "unknown", display_name: null, avatar_url: null },
  }));

  return NextResponse.json({ comments: enriched });
}

export async function POST(request: NextRequest) {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = checkRateLimit(`comments:${user.id}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many comments. Slow down." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  const { postId, content } = await request.json();
  if (!postId || !content?.trim()) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (content.length > 200) return NextResponse.json({ error: "Comment too long (max 200 chars)" }, { status: 400 });

  const db = createSupabaseServiceClient();

  const { data, error } = await db
    .from("comments")
    .insert({ user_id: user.id, post_id: postId, content: content.trim() })
    .select("id,user_id,post_id,content,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: profile } = await db
    .from("profiles")
    .select("id,username,display_name,avatar_url")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    comment: {
      ...data,
      profile: profile ?? { id: user.id, username: "unknown", display_name: null, avatar_url: null },
    },
  });
}

export async function DELETE(request: NextRequest) {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const commentId = request.nextUrl.searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error: "Missing commentId" }, { status: 400 });

  const db = createSupabaseServiceClient();
  await db.from("comments").delete().eq("id", commentId).eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
