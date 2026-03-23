import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetUserId } = await request.json();

  if (!targetUserId || targetUserId === user.id) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .single();

  if (existing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId);
    return NextResponse.json({ action: "unfollowed" });
  } else {
    await supabase
      .from("follows")
      .insert({ follower_id: user.id, following_id: targetUserId });

    // Side effects: streak for follower + notify/vibe for followee (non-blocking)
    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseServiceClient() : supabase;
    Promise.all([
      supabase.rpc("update_user_streak", { user_uuid: user.id }),
      db.from("notifications").insert({
        user_id: targetUserId,
        actor_id: user.id,
        type: "follow",
      }),
      (async () => {
        const { data: followeeProfile } = await db.from("profiles").select("vibe_score").eq("id", targetUserId).single();
        if (followeeProfile) {
          await db.from("profiles")
            .update({ vibe_score: (followeeProfile.vibe_score ?? 0) + 1 })
            .eq("id", targetUserId);
        }
      })(),
    ]).catch(() => null);

    return NextResponse.json({ action: "followed" });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { followingId } = await request.json();
  if (!followingId) return NextResponse.json({ error: "Missing followingId" }, { status: 400 });

  await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  return NextResponse.json({ action: "unfollowed" });
}
