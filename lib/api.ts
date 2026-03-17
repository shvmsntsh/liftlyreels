import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { PostRecord } from "@/lib/types";
import { getFallbackPosts } from "@/utils/fallback-posts";

function normalizePost(row: Record<string, unknown>): PostRecord {
  const content = Array.isArray(row.content)
    ? row.content.filter((item): item is string => typeof item === "string")
    : [];

  return {
    id: String(row.id),
    title: String(row.title ?? "Untitled"),
    content,
    category: String(row.category ?? "General"),
    source: String(row.source ?? "Liftly"),
    image_url: typeof row.image_url === "string" ? row.image_url : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function getPosts(limit = 20): Promise<PostRecord[]> {
  const fallbackPosts = getFallbackPosts();

  if (!isSupabaseConfigured()) {
    return fallbackPosts.slice(0, limit);
  }

  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return fallbackPosts.slice(0, limit);
    }

    const { data, error } = await supabase
      .from("posts")
      .select("id,title,content,category,source,image_url,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data?.length) {
      return fallbackPosts.slice(0, limit);
    }

    return data.map((row) => normalizePost(row as Record<string, unknown>));
  } catch {
    return fallbackPosts.slice(0, limit);
  }
}
