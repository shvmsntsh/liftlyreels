import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";

/** Returns the admin client if the service role key is configured, otherwise the auth client. */
function getDb(authClient: ReturnType<typeof createSupabaseServerClient>) {
  try {
    return createSupabaseServiceClient();
  } catch {
    // SUPABASE_SERVICE_ROLE_KEY not set — fall back to user session client.
    // Comments will still work as long as RLS INSERT policy is in place
    // ("Users can insert own comments" on public.comments).
    return authClient;
  }
}

export async function GET(request: NextRequest) {
  const authClient = createSupabaseServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const postId = request.nextUrl.searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  const db = getDb(authClient);

  const { data, error } = await db
    .from("comments")
    .select("id,user_id,post_id,content,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("[comments GET] db error:", error.message, error.code);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const comments = data ?? [];
  const userIds = Array.from(new Set(comments.map((c: { user_id: string }) => c.user_id)));
  const profilesMap: Record<
    string,
    { id: string; username: string; display_name: string | null; avatar_url: string | null }
  > = {};

  if (userIds.length > 0) {
    const { data: profiles, error: pErr } = await db
      .from("profiles")
      .select("id,username,display_name,avatar_url")
      .in("id", userIds);
    if (pErr) console.error("[comments GET] profiles error:", pErr.message);
    for (const p of profiles ?? []) profilesMap[p.id] = p;
  }

  const enriched = comments.map((c: { user_id: string }) => ({
    ...c,
    profile: profilesMap[c.user_id] ?? {
      id: c.user_id,
      username: "unknown",
      display_name: null,
      avatar_url: null,
    },
  }));

  return NextResponse.json({ comments: enriched });
}

export async function POST(request: NextRequest) {
  const authClient = createSupabaseServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    console.error("[comments POST] No authenticated user — cookie/session missing");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = checkRateLimit(`comments:${user.id}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many comments. Slow down." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { postId?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { postId, content } = body;
  if (!postId || !content?.trim()) {
    return NextResponse.json({ error: "Missing postId or content" }, { status: 400 });
  }
  if (content.length > 200) {
    return NextResponse.json({ error: "Comment too long (max 200 chars)" }, { status: 400 });
  }

  const db = getDb(authClient);

  // Insert the comment
  const { data: inserted, error: insertError } = await db
    .from("comments")
    .insert({ user_id: user.id, post_id: postId, content: content.trim() })
    .select("id,user_id,post_id,content,created_at")
    .single();

  if (insertError) {
    console.error(
      "[comments POST] insert error:",
      insertError.message,
      insertError.code,
      insertError.details,
      insertError.hint
    );
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Fetch commenter's profile for the response
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("id,username,display_name,avatar_url")
    .eq("id", user.id)
    .single();
  if (profileError) console.error("[comments POST] profile fetch error:", profileError.message);

  // Non-blocking side effects: streak, notification, owner vibe
  Promise.all([
    authClient.rpc("update_user_streak", { user_uuid: user.id }),
    (async () => {
      try {
        const sdb = getDb(authClient);
        const { data: post } = await sdb
          .from("posts")
          .select("author_id")
          .eq("id", postId)
          .single();
        if (!post?.author_id || post.author_id === user.id) return;

        await sdb.from("notifications").insert({
          user_id: post.author_id,
          actor_id: user.id,
          type: "comment",
          post_id: postId,
        });

        const { data: ownerProfile } = await sdb
          .from("profiles")
          .select("vibe_score")
          .eq("id", post.author_id)
          .single();
        if (ownerProfile) {
          await sdb
            .from("profiles")
            .update({ vibe_score: (ownerProfile.vibe_score ?? 0) + 1 })
            .eq("id", post.author_id);
        }
      } catch (e) {
        console.error("[comments POST] side-effect error:", e);
      }
    })(),
  ]).catch((e) => console.error("[comments POST] Promise.all error:", e));

  return NextResponse.json({
    comment: {
      ...inserted,
      profile: profile ?? {
        id: user.id,
        username: "unknown",
        display_name: null,
        avatar_url: null,
      },
    },
  });
}

export async function DELETE(request: NextRequest) {
  const authClient = createSupabaseServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const commentId = request.nextUrl.searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error: "Missing commentId" }, { status: 400 });

  const db = getDb(authClient);
  await db.from("comments").delete().eq("id", commentId).eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
