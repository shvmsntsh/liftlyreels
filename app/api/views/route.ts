import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { recomputeEngagementScore } from "@/lib/engagement-score";

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // 120 views per minute per user (each reel scroll = 1 view)
  const rl = checkRateLimit(`views:${user.id}`, 120, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const { postId } = await request.json();
  if (!postId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Try RPC first, fall back to read + write
  const { error: rpcError } = await supabase.rpc("increment_views", { post_id: postId });
  if (rpcError) {
    const { data: post } = await supabase
      .from("posts")
      .select("views_count")
      .eq("id", postId)
      .single();
    if (post) {
      await supabase
        .from("posts")
        .update({ views_count: (post.views_count ?? 0) + 1 })
        .eq("id", postId);
    }
  }

  // Recompute engagement score (non-blocking)
  void recomputeEngagementScore(postId);

  return NextResponse.json({ ok: true });
}
