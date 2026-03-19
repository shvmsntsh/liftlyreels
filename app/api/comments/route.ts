import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const postId = request.nextUrl.searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  const service = createSupabaseServiceClient();

  const { data, error } = await service
    .from("comments")
    .select("id,user_id,post_id,content,created_at,profiles(id,username,display_name,avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId, content } = await request.json();

  if (!postId || !content?.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (content.length > 200) {
    return NextResponse.json({ error: "Comment too long (max 200 chars)" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();

  const { data, error } = await service
    .from("comments")
    .insert({ user_id: user.id, post_id: postId, content: content.trim() })
    .select("id,user_id,post_id,content,created_at,profiles(id,username,display_name,avatar_url)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const commentId = request.nextUrl.searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error: "Missing commentId" }, { status: 400 });

  const service = createSupabaseServiceClient();

  await service
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
