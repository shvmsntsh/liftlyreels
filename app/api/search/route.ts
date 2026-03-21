import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type") ?? "all"; // posts | users | all

  if (!q || q.length < 2) {
    return NextResponse.json({ posts: [], users: [] });
  }

  const supabase = createSupabaseServerClient();
  const pattern = `%${q}%`;
  const results: { posts: unknown[]; users: unknown[] } = { posts: [], users: [] };

  try {
    if (type === "posts" || type === "all") {
      let { data: posts, error } = await supabase
        .from("posts")
        .select(
          `id,title,category,gradient,tags,is_user_created,created_at,
          profiles(id,username,display_name,avatar_url)`
        )
        .or(`title.ilike.${pattern},tags.cs.{"${q}"}`)
        .order("created_at", { ascending: false })
        .limit(20);

      // Fallback if join fails
      if (error) {
        const retry = await supabase
          .from("posts")
          .select(`id,title,category,gradient,tags,is_user_created,created_at,author_id`)
          .or(`title.ilike.${pattern},tags.cs.{"${q}"}`)
          .order("created_at", { ascending: false })
          .limit(20);
        posts = retry.data as typeof posts;
      }

      results.posts = posts ?? [];
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
