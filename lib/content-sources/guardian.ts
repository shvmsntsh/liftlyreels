// Guardian RSS content source — extracted from app/api/news-reel/route.ts

export const GUARDIAN_SECTIONS = [
  { label: "Technology & AI", id: "technology", emoji: "\u{1F916}", guardianSlug: "technology" },
  { label: "Business", id: "business", emoji: "\u{1F4C8}", guardianSlug: "business" },
  { label: "World News", id: "world", emoji: "\u{1F30D}", guardianSlug: "world" },
  { label: "Science", id: "science", emoji: "\u{1F52C}", guardianSlug: "science" },
  { label: "Sport", id: "sport", emoji: "\u{1F3C6}", guardianSlug: "sport" },
  { label: "Environment", id: "environment", emoji: "\u{1F331}", guardianSlug: "environment" },
  { label: "Health & Life", id: "lifeandstyle", emoji: "\u{1F4AA}", guardianSlug: "lifeandstyle" },
  { label: "Money & Finance", id: "money", emoji: "\u{1F4B0}", guardianSlug: "money" },
  { label: "Culture", id: "culture", emoji: "\u{1F3AD}", guardianSlug: "culture" },
  { label: "Education", id: "education", emoji: "\u{1F4DA}", guardianSlug: "education" },
] as const;

export type GuardianSection = (typeof GUARDIAN_SECTIONS)[number];

export type GuardianArticle = {
  title: string;
  description: string;
  image_url: string | null;
  source: string;
  category: string;
  emoji: string;
  url: string;
  pub_date: string;
};

export function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m: string, d: string) => String.fromCharCode(parseInt(d)))
    .replace(/\s+/g, " ")
    .trim();
}

export function parseRSSItem(xml: string, section: GuardianSection): GuardianArticle | null {
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

export async function fetchOgImage(articleUrl: string): Promise<string | null> {
  if (!articleUrl || articleUrl === "#") return null;
  try {
    const res = await fetch(articleUrl, {
      signal: AbortSignal.timeout(3000),
      headers: { "User-Agent": "Liftly/1.0" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match =
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function fetchSectionArticles(
  section: GuardianSection,
  maxItems: number = 1
): Promise<GuardianArticle[]> {
  const url = `https://www.theguardian.com/${section.guardianSlug}/rss`;
  try {
    const res = await fetch(url, { next: { revalidate: 0 }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const xml = await res.text();

    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const results: GuardianArticle[] = [];

    for (const item of items) {
      if (results.length >= maxItems) break;

      const parsed = parseRSSItem(item, section);
      if (!parsed) continue;

      if (parsed.pub_date) {
        const dt = new Date(parsed.pub_date).getTime();
        if (!isNaN(dt) && dt < since) continue;
      }

      if (!parsed.image_url) {
        parsed.image_url = await fetchOgImage(parsed.url);
      }
      results.push(parsed);
    }

    // If no recent articles, take the latest as fallback
    if (results.length === 0 && items[0]) {
      const fallback = parseRSSItem(items[0], section);
      if (fallback) {
        if (!fallback.image_url) fallback.image_url = await fetchOgImage(fallback.url);
        results.push(fallback);
      }
    }

    return results;
  } catch {
    return [];
  }
}

export async function fetchGuardianArticles(
  sections: readonly GuardianSection[] = GUARDIAN_SECTIONS,
  maxPerSection: number = 2
): Promise<GuardianArticle[]> {
  const results = await Promise.all(
    sections.map((s) => fetchSectionArticles(s, maxPerSection))
  );
  return results.flat();
}
