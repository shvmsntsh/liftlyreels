import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type");
  const userId = request.nextUrl.searchParams.get("userId");

  if (!type || !userId) {
    return NextResponse.json({ error: "Missing type or userId" }, { status: 400 });
  }

  let userIds: string[] = [];

  if (type === "followers") {
    const { data } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", userId);
    userIds = data?.map((r) => r.follower_id) ?? [];
  } else if (type === "following") {
    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);
    userIds = data?.map((r) => r.following_id) ?? [];
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (userIds.length === 0) {
    return NextResponse.json({ users: [] });
  }

  // Fetch profiles separately (no FK join)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url,vibe_score")
    .in("id", userIds);

  // Check which ones the current user follows
  const { data: currentFollows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id)
    .in("following_id", userIds);

  const followingSet = new Set(currentFollows?.map((f) => f.following_id) ?? []);

  const users = (profiles ?? []).map((p) => ({
    ...p,
    is_following: followingSet.has(p.id),
    is_self: p.id === user.id,
  }));

  return NextResponse.json({ users });
}
