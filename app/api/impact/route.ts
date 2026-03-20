import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("impact_journal")
    .select("id,post_id,action_taken,created_at,posts(id,title,category,gradient)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId, actionTaken } = await request.json();

  if (!postId || !actionTaken?.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Validate UUID format — fallback posts use string IDs like "fallback-10"
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isRealPost = UUID_RE.test(postId);

  if (isRealPost) {
    const { error } = await supabase
      .from("impact_journal")
      .insert({ user_id: user.id, post_id: postId, action_taken: actionTaken.trim() })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // +3 vibe for acting on a reel (even for fallback posts)
  const { data: profile } = await supabase
    .from("profiles")
    .select("vibe_score")
    .eq("id", user.id)
    .single();
  if (profile) {
    await supabase
      .from("profiles")
      .update({ vibe_score: (profile.vibe_score ?? 0) + 3 })
      .eq("id", user.id);
  }

  return NextResponse.json({ entry: { id: isRealPost ? postId : "local" }, success: true });
}
