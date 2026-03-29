import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase-server";
import { fetchGuardianArticles, GUARDIAN_SECTIONS } from "@/lib/content-sources/guardian";
import { fetchRedditArticles } from "@/lib/content-sources/reddit";
import { mapGuardianToPost, mapRedditToPost } from "@/lib/content-sources/action-mapper";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this automatically for cron jobs)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runCollection("cron");
}

// POST allows admin manual trigger
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runCollection("admin");
}

async function runCollection(triggeredBy: "cron" | "admin") {
  const errors: string[] = [];
  const sourcesSummary: Record<string, number> = {};
  let itemsCollected = 0;
  let itemsDeleted = 0;

  const db = createSupabaseServiceClient();

  // Fetch from all sources in parallel
  const [guardianArticles, redditArticles] = await Promise.all([
    fetchGuardianArticles(GUARDIAN_SECTIONS, 2).catch((e) => {
      errors.push(`Guardian: ${String(e)}`);
      return [];
    }),
    fetchRedditArticles().catch((e) => {
      errors.push(`Reddit: ${String(e)}`);
      return [];
    }),
  ]);

  sourcesSummary.guardian = guardianArticles.length;
  sourcesSummary.reddit = redditArticles.length;

  // Map to post format
  const guardianPosts = guardianArticles.map(mapGuardianToPost);
  const redditPosts = redditArticles.map(mapRedditToPost);
  const allPosts = [...guardianPosts, ...redditPosts];

  // Upsert into posts table (skip duplicates by title)
  for (const post of allPosts) {
    try {
      // Check if title already exists (prevent duplicates)
      const { count } = await db
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("title", post.title);

      if ((count ?? 0) > 0) continue;

      const { error } = await db.from("posts").insert(post);
      if (error) {
        errors.push(`Insert "${post.title.slice(0, 40)}": ${error.message}`);
      } else {
        itemsCollected++;
      }
    } catch (e) {
      errors.push(`Insert error: ${String(e)}`);
    }
  }

  // Delete stale auto-collected content (>7 days old)
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: stale } = await db
      .from("posts")
      .select("id")
      .is("author_id", null)
      .eq("is_user_created", false)
      .lt("created_at", sevenDaysAgo);

    if (stale && stale.length > 0) {
      const { error } = await db
        .from("posts")
        .delete()
        .in("id", stale.map((s) => s.id));

      if (error) {
        errors.push(`Cleanup: ${error.message}`);
      } else {
        itemsDeleted = stale.length;
      }
    }
  } catch (e) {
    errors.push(`Cleanup error: ${String(e)}`);
  }

  // Log to content_collection_log
  try {
    await db.from("content_collection_log").insert({
      items_collected: itemsCollected,
      items_deleted: itemsDeleted,
      sources_summary: sourcesSummary,
      errors: errors.length > 0 ? errors : null,
      triggered_by: triggeredBy,
    });
  } catch {
    // Table may not exist yet
  }

  return NextResponse.json({
    success: true,
    items_collected: itemsCollected,
    items_deleted: itemsDeleted,
    sources: sourcesSummary,
    errors: errors.length > 0 ? errors : undefined,
  });
}
