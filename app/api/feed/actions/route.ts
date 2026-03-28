import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get users this person follows
  const { data: followsData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followedIds = followsData?.map((f) => f.following_id) ?? [];
  // Include own actions too
  const relevantIds = [user.id, ...followedIds];

  // Fetch recent impact entries
  const { data: entries, error } = await supabase
    .from("impact_journal")
    .select("id,user_id,post_id,action_taken,created_at")
    .in("user_id", relevantIds)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !entries?.length) {
    return NextResponse.json({ actions: [] });
  }

  // Fetch profiles
  const userIds = Array.from(new Set(entries.map((e) => e.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url")
    .in("id", userIds);

  const profileMap: Record<string, { username: string; display_name: string | null; avatar_url: string | null }> = {};
  for (const p of profiles ?? []) {
    profileMap[p.id] = { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url };
  }

  // Fetch posts
  const postIds = Array.from(new Set(entries.filter((e) => e.post_id).map((e) => e.post_id as string)));
  const postMap: Record<string, { title: string; gradient: string | null; category: string }> = {};
  if (postIds.length > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select("id,title,gradient,category")
      .in("id", postIds);
    for (const p of posts ?? []) {
      postMap[p.id] = { title: p.title, gradient: p.gradient, category: p.category };
    }
  }

  const actions = entries.map((e) => ({
    id: e.id,
    user_id: e.user_id,
    post_id: e.post_id,
    action_taken: e.action_taken,
    created_at: e.created_at,
    is_own: e.user_id === user.id,
    actor: profileMap[e.user_id] ?? { username: "user", display_name: null, avatar_url: null },
    post: e.post_id ? postMap[e.post_id] ?? null : null,
  }));

  return NextResponse.json({ actions });
}
