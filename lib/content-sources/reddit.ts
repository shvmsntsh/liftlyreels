// Reddit public JSON content source — no API key needed

import { normalizeCollectedTitle } from "./normalize";

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

type RedditListing = {
  data?: {
    children?: Array<{
      data?: {
        title?: string;
        selftext?: string;
        permalink?: string;
        thumbnail?: string;
        preview?: {
          images?: Array<{
            source?: {
              url?: string;
            };
          }>;
        };
      };
    }>;
  };
};

type RedditPostData = NonNullable<NonNullable<RedditListing["data"]>["children"]>[number]["data"];

function decodeRedditText(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function extractImage(post: RedditPostData) {
  const preview = post?.preview?.images?.[0]?.source?.url;
  if (preview) return decodeRedditText(preview);

  const thumbnail = post?.thumbnail;
  if (thumbnail && /^https?:\/\//i.test(thumbnail)) {
    return thumbnail;
  }

  return null;
}

function mapListingToArticles(listing: RedditListing, config: SubredditConfig): RedditArticle[] {
  const children = listing.data?.children ?? [];

  return children
    .map((child) => child.data)
    .filter((post): post is NonNullable<typeof post> => Boolean(post?.title))
    .slice(0, 3)
    .map((post) => {
      const title = normalizeCollectedTitle(post.title ?? "");
      const description = decodeRedditText(post.selftext?.trim() || title);
      const permalink = post.permalink?.startsWith("/")
        ? `https://www.reddit.com${post.permalink}`
        : post.permalink ?? "#";

      return {
        title,
        description,
        image_url: extractImage(post),
        source: `r/${config.sub}`,
        category: config.category,
        url: permalink,
        sub: config.sub,
      };
    });
}

async function fetchSubreddit(config: SubredditConfig): Promise<RedditArticle[]> {
  const url = `https://www.reddit.com/r/${config.sub}/top.json?t=day&limit=3&raw_json=1`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Liftly/1.0 (content collector)" },
    });

    if (!res.ok) {
      return [];
    }

    const listing = (await res.json()) as RedditListing;
    return mapListingToArticles(listing, config);
  } catch {
    return [];
  }
}

export async function fetchRedditArticles(): Promise<RedditArticle[]> {
  const results = await Promise.all(SUBREDDITS.map(fetchSubreddit));
  return results.flat();
}
