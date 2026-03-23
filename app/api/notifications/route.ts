import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase-server";

function getDb(authClient: ReturnType<typeof createSupabaseServerClient>) {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseServiceClient() : authClient;
}

export async function GET() {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb(authClient);

  const { data, error } = await db
    .from("notifications")
    .select("id,type,post_id,reaction_type,read,created_at,actor_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ notifications: [], unreadCount: 0 });

  const notifications = data ?? [];
  const actorIds = Array.from(new Set(notifications.map((n: { actor_id: string }) => n.actor_id)));
  const postIds = Array.from(
    new Set(notifications.filter((n: { post_id: string | null }) => n.post_id).map((n: { post_id: string }) => n.post_id))
  );

  const [profilesResult, postsResult] = await Promise.all([
    actorIds.length > 0
      ? db.from("profiles").select("id,username,display_name,avatar_url").in("id", actorIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? db.from("posts").select("id,title,gradient,image_url").in("id", postIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profilesMap: Record<string, { username: string; display_name: string | null; avatar_url: string | null }> = {};
  for (const p of profilesResult.data ?? []) profilesMap[p.id] = p;

  const postsMap: Record<string, { title: string; gradient: string | null; image_url: string | null }> = {};
  for (const p of postsResult.data ?? []) postsMap[p.id] = p;

  const enriched = notifications.map((n: { actor_id: string; post_id: string | null; read: boolean }) => ({
    ...n,
    actor: profilesMap[n.actor_id] ?? { username: "someone", display_name: null, avatar_url: null },
    post: n.post_id ? (postsMap[n.post_id] ?? null) : null,
  }));

  const unreadCount = notifications.filter((n: { read: boolean }) => !n.read).length;

  return NextResponse.json({ notifications: enriched, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb(authClient);
  const body = await request.json().catch(() => ({}));

  if (body.ids && Array.isArray(body.ids)) {
    await db.from("notifications").update({ read: true }).in("id", body.ids).eq("user_id", user.id);
  } else {
    await db.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  }

  return NextResponse.json({ success: true });
}
