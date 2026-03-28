import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// ── Guardian RSS sections (no API key needed) ─────────────────────────────
const SECTIONS = [
  { label: "Technology & AI", id: "technology", emoji: "🤖", guardianSlug: "technology" },
  { label: "Business", id: "business", emoji: "📈", guardianSlug: "business" },
  { label: "World News", id: "world", emoji: "🌍", guardianSlug: "world" },
  { label: "Science", id: "science", emoji: "🔬", guardianSlug: "science" },
  { label: "Sport", id: "sport", emoji: "🏆", guardianSlug: "sport" },
  { label: "Environment", id: "environment", emoji: "🌱", guardianSlug: "environment" },
  { label: "Health & Life", id: "lifeandstyle", emoji: "💪", guardianSlug: "lifeandstyle" },
  { label: "Money & Finance", id: "money", emoji: "💰", guardianSlug: "money" },
  { label: "Culture", id: "culture", emoji: "🎭", guardianSlug: "culture" },
  { label: "Education", id: "education", emoji: "📚", guardianSlug: "education" },
];

// Map Liftly proof categories → Guardian sections for personalization
const CATEGORY_MAP: Record<string, string> = {
  Gym: "sport",
  Books: "education",
  Diet: "lifeandstyle",
  Mindset: "lifeandstyle",
  Wellness: "lifeandstyle",
  Finance: "money",
  Relationships: "culture",
};

// ── RSS item parser ───────────────────────────────────────────────────────
function parseRSSItem(xml: string, section: (typeof SECTIONS)[0]) {
  const get = (tag: string) =>
    xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))?.[1] ??
    xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1] ?? "";

  const title = get("title").trim();
  const rawDesc = get("description").trim();
  const url = get("link").trim() || get("guid").trim() || "#";
  const pubDate = get("pubDate").trim();
  const imageUrl =
    xml.match(/media:content[^>]*url="([^"]+)"/)?.[1] ??
    xml.match(/enclosure[^>]*url="([^"]+)"/)?.[1] ??
    null;

  if (!title) return null;

  const decode = (s: string) =>
    s
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#039;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

  return {
    title: decode(title).slice(0, 120),
    description: decode(rawDesc).slice(0, 200),
    image_url: imageUrl,
    source: "The Guardian",
    category: section.label,
    emoji: section.emoji,
    url,
    pub_date: pubDate,
  };
}

async function fetchSectionArticle(section: (typeof SECTIONS)[0]) {
  const url = `https://www.theguardian.com/${section.guardianSlug}/rss`;
  try {
    const res = await fetch(url, { next: { revalidate: 0 }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const xml = await res.text();

    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
    const since = Date.now() - 24 * 60 * 60 * 1000;

    for (const item of items) {
      const parsed = parseRSSItem(item, section);
      if (!parsed) continue;

      // Filter to last 24 hours (if date parseable)
      if (parsed.pub_date) {
        const dt = new Date(parsed.pub_date).getTime();
        if (!isNaN(dt) && dt < since) continue;
      }

      return parsed;
    }
    // No 24h article — return latest anyway as fallback
    return items[0] ? parseRSSItem(items[0], section) : null;
  } catch {
    return null;
  }
}

// ── Personalization: reorder sections by user's proof categories ──────────
function reorderSections(userCategories: string[]) {
  const preferredIds = userCategories
    .map((c) => CATEGORY_MAP[c])
    .filter(Boolean);

  const sorted = [...SECTIONS].sort((a, b) => {
    const ai = preferredIds.indexOf(a.id);
    const bi = preferredIds.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return sorted;
}

// ── GET /api/news-reel ────────────────────────────────────────────────────
export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userCategories = searchParams.get("categories")?.split(",").filter(Boolean) ?? [];

  // Check Supabase cache (valid if expires_at > now)
  try {
    const { data: cached } = await supabase
      .from("news_reels")
      .select("id, slides")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached?.slides && Array.isArray(cached.slides) && cached.slides.length > 0) {
      return NextResponse.json({ reel_id: cached.id, slides: cached.slides });
    }
  } catch {
    // Table may not exist yet — continue to generate fresh
  }

  // Generate fresh reel by fetching all sections in parallel
  const sections = reorderSections(userCategories);
  const results = await Promise.all(sections.map(fetchSectionArticle));
  const slides = results.filter(Boolean) as NonNullable<(typeof results)[0]>[];

  // Try to cache result in Supabase (4-hour TTL)
  try {
    if (slides.length > 0) {
      const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
      const { data: saved } = await supabase
        .from("news_reels")
        .insert({ slides, expires_at: expiresAt })
        .select("id")
        .single();
      return NextResponse.json({ reel_id: saved?.id ?? null, slides });
    }
  } catch {
    // Ignore cache write failure (table may not exist)
  }

  return NextResponse.json({ reel_id: null, slides });
}
