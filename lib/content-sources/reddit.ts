// Reddit public RSS content source — no API key needed

import { decode } from "./guardian";

type SubredditConfig = {
  sub: string;
  category: string;
};

const SUBREDDITS: SubredditConfig[] = [
  { sub: "getmotivated", category: "Mindset" },
  { sub: "selfimprovement", category: "Mindset" },
  { sub: "getdisciplined", category: "Mindset" },
  { sub: "fitness", category: "Gym" },
  { sub: "bodyweightfitness", category: "Gym" },
  { sub: "EatCheapAndHealthy", category: "Diet" },
  { sub: "MealPrepSunday", category: "Diet" },
  { sub: "books", category: "Books" },
  { sub: "suggestmeabook", category: "Books" },
  { sub: "meditation", category: "Wellness" },
  { sub: "sleep", category: "Wellness" },
  { sub: "personalfinance", category: "Finance" },
  { sub: "financialindependence", category: "Finance" },
  { sub: "socialskills", category: "Relationships" },
];

export type RedditArticle = {
  title: string;
  description: string;
  image_url: string | null;
  source: string;
  category: string;
  url: string;
  sub: string;
};

function parseRedditRSS(xml: string, config: SubredditConfig): RedditArticle[] {
  const items = xml.match(/<entry>([\s\S]*?)<\/entry>/g) ?? [];
  const results: RedditArticle[] = [];

  for (const item of items.slice(0, 3)) {
    const titleMatch = item.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    const title = titleMatch ? decode(titleMatch[1]).slice(0, 120) : "";
    if (!title) continue;

    const contentMatch = item.match(/<content[^>]*>([\s\S]*?)<\/content>/);
    const rawContent = contentMatch ? decode(contentMatch[1]) : "";
    const description = rawContent.slice(0, 200);

    const linkMatch = item.match(/<link[^>]*href="([^"]+)"/);
    const url = linkMatch?.[1] ?? "#";

    // Try to extract thumbnail from content
    const imgMatch = item.match(/<media:thumbnail[^>]*url="([^"]+)"/i) ??
      rawContent.match(/https?:\/\/[^\s"<>]+\.(?:jpg|jpeg|png|webp|gif)/i);
    const image_url = imgMatch?.[1] ?? imgMatch?.[0] ?? null;

    results.push({
      title,
      description,
      image_url,
      source: `r/${config.sub}`,
      category: config.category,
      url,
      sub: config.sub,
    });
  }

  return results;
}

async function fetchSubreddit(config: SubredditConfig): Promise<RedditArticle[]> {
  const url = `https://www.reddit.com/r/${config.sub}/top/.rss?t=day`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Liftly/1.0 (content collector)" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRedditRSS(xml, config);
  } catch {
    return [];
  }
}

export async function fetchRedditArticles(): Promise<RedditArticle[]> {
  const results = await Promise.all(SUBREDDITS.map(fetchSubreddit));
  return results.flat();
}
