import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase-server";
import { fetchGuardianArticles, GUARDIAN_SECTIONS } from "@/lib/content-sources/guardian";
import { fetchRedditArticles } from "@/lib/content-sources/reddit";
import { mapGuardianToPost, mapRedditToPost, generateCategoryReel } from "@/lib/content-sources/action-mapper";
import { normalizeCollectedPostFields } from "@/lib/content-sources/normalize";

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
  const sourcesSummary: Record<string, number | Record<string, number>> = {};
  let itemsCollected = 0;
  let itemsDeleted = 0;
  let itemsNormalized = 0;

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

  // Normalize existing outside-collected reels in place so all current reels stay clean.
  try {
    const pageSize = 200;
    let from = 0;

    while (true) {
      const { data: rows, error } = await db
        .from("posts")
        .select("id,title,content,category,source")
        .is("author_id", null)
        .eq("is_user_created", false)
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) {
        errors.push(`Backfill read: ${error.message}`);
        break;
      }

      if (!rows?.length) break;

      for (const row of rows) {
        const normalized = normalizeCollectedPostFields({
          title: typeof row.title === "string" ? row.title : "Untitled",
          content: Array.isArray(row.content)
            ? row.content.filter((item): item is string => typeof item === "string")
            : typeof row.content === "string"
              ? row.content
              : [],
          category: typeof row.category === "string" ? row.category : "General",
          source: typeof row.source === "string" ? row.source : "Liftly",
        });

        const currentContent = Array.isArray(row.content)
          ? row.content.filter((item): item is string => typeof item === "string")
          : [];

        const needsUpdate =
          normalized.title !== row.title ||
          normalized.source !== row.source ||
          JSON.stringify(normalized.content) !== JSON.stringify(currentContent);

        if (!needsUpdate) continue;

        const { error: updateError } = await db
          .from("posts")
          .update({
            title: normalized.title,
            source: normalized.source,
            content: normalized.content,
          })
          .eq("id", row.id);

        if (updateError) {
          errors.push(`Backfill "${String(row.id).slice(0, 8)}": ${updateError.message}`);
        } else {
          itemsNormalized++;
        }
      }

      if (rows.length < pageSize) break;
      from += pageSize;
    }
  } catch (e) {
    errors.push(`Backfill error: ${String(e)}`);
  }

  // Fill category gaps with synthetic reels
  try {
    const CATEGORIES = ["Mindset", "Gym", "Diet", "Books", "Wellness", "Finance", "Relationships"];
    const categoryCount: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      categoryCount[cat] = 0;
    }

    // Count collected posts per category
    for (const post of allPosts) {
      categoryCount[post.category] = (categoryCount[post.category] ?? 0) + 1;
    }

    // Generate synthetic reels for underrepresented categories
    const syntheticReels = [];
    for (const category of CATEGORIES) {
      if ((categoryCount[category] ?? 0) < 2) {
        // Generate 2 reels for missing/underrepresented categories
        for (let i = 0; i < 2; i++) {
          const syntheticPost = generateCategoryReel(category);
          syntheticReels.push(syntheticPost);
          categoryCount[category]++;
        }
      }
    }

    // Insert synthetic reels
    for (const post of syntheticReels) {
      try {
        const { count } = await db
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("title", post.title);

        if ((count ?? 0) === 0) {
          const { error } = await db.from("posts").insert(post);
          if (!error) {
            itemsCollected++;
          }
        }
      } catch (e) {
        // Skip on error, continue with next
      }
    }

    // Add category breakdown to sources summary
    sourcesSummary.category_counts = categoryCount;
  } catch (e) {
    errors.push(`Category gap-fill error: ${String(e)}`);
  }

  sourcesSummary.normalized_existing = itemsNormalized;

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
    items_normalized: itemsNormalized,
    sources: sourcesSummary,
    errors: errors.length > 0 ? errors : undefined,
  });
}
