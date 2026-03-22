import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type") ?? "all";

  if (!q || q.length < 2) {
    return NextResponse.json({ posts: [], users: [] });
  }

  const supabase = createSupabaseServerClient();
  const pattern = `%${q}%`;
  const results: { posts: unknown[]; users: unknown[] } = { posts: [], users: [] };

  try {
    if (type === "posts" || type === "all") {
      const { data: posts } = await supabase
        .from("posts")
        .select(`id,title,category,gradient,tags,is_user_created,created_at,author_id`)
        .or(`title.ilike.${pattern},tags.cs.{"${q}"}`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (posts?.length) {
        // Fetch author profiles separately
        const authorIds = Array.from(new Set(posts.map((p) => p.author_id as string).filter(Boolean)));
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,username,display_name,avatar_url")
          .in("id", authorIds);

        const profileMap: Record<string, unknown> = {};
        for (const p of profiles ?? []) {
          profileMap[p.id] = p;
        }

        results.posts = posts.map((row) => ({
          ...row,
          author: row.author_id ? profileMap[row.author_id as string] ?? null : null,
        }));
      }
    }

    if (type === "users" || type === "all") {
      const { data: users } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url,vibe_score,bio")
        .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
        .limit(20);

      results.users = users ?? [];
    }
  } catch {
    return NextResponse.json({ posts: [], users: [] });
  }

  return NextResponse.json(results);
}
