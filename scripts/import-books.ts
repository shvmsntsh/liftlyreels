const { config } = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const { Client } = require("pg");

type ExternalBookReel = {
  title: string;
  content: string[];
  category: string;
  source: string;
  image_url: string | null;
  created_at: string;
};

type OpenLibrarySearchDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
};

type OpenLibrarySearchResponse = {
  docs?: OpenLibrarySearchDoc[];
};

type OpenLibraryWorkResponse = {
  description?: string | { value?: string };
  subjects?: string[];
};

const OPEN_LIBRARY_HEADERS = {
  "User-Agent": "LiftlyReels/1.0 (contact: shivamsantosh@example.com)",
};

const CURATED_BOOKS = [
  "Meditations Marcus Aurelius",
  "Letters from a Stoic Seneca",
  "The Enchiridion Epictetus",
  "Self-Reliance Ralph Waldo Emerson",
  "Walden Henry David Thoreau",
  "Civil Disobedience Henry David Thoreau",
  "As a Man Thinketh James Allen",
  "The Art of War Sun Tzu",
  "How to Live on 24 Hours a Day Arnold Bennett",
  "The Science of Getting Rich Wallace D. Wattles",
  "The Republic Plato",
  "Autobiography of Benjamin Franklin",
  "Narrative of the Life of Frederick Douglass",
  "The Essays of Michel de Montaigne",
  "Thus Spake Zarathustra Friedrich Nietzsche",
  "The Problems of Philosophy Bertrand Russell",
];

config({ path: ".env.local" });

function normalizeDescription(description?: string | { value?: string }) {
  if (!description) {
    return "";
  }

  const raw = typeof description === "string" ? description : description.value ?? "";
  return raw.replace(/\s+/g, " ").replace(/\[[^\]]+\]/g, "").trim();
}

function cleanSubjects(subjects: string[] = []) {
  return subjects
    .filter((subject) => subject && !subject.includes("Accessible book"))
    .map((subject) => subject.replace(/\s+/g, " ").trim())
    .slice(0, 6);
}

function firstSentence(text: string) {
  if (!text) {
    return "";
  }

  const [sentence] = text.split(/(?<=[.!?])\s+/);
  return sentence?.trim() ?? "";
}

function buildBestPart(subjects: string[], title: string) {
  const chosen = subjects.slice(0, 2).map((subject) => subject.toLowerCase());

  if (!chosen.length) {
    return `Best part: ${title} keeps returning to decisions, character, and what to do when life gets noisy.`;
  }

  return `Best part: it turns ${chosen.join(" and ")} into something you can actually notice in daily life.`;
}

function buildActionTakeaway(subjects: string[], title: string) {
  const first = subjects[0]?.toLowerCase();

  if (!first) {
    return `Use it today: pick one idea from ${title} and turn it into a repeatable rule this week.`;
  }

  return `Use it today: audit one moment in your day through the lens of ${first} and choose a cleaner response.`;
}

function buildReadIf(author: string, subjects: string[]) {
  const tags = subjects.slice(0, 3).map((subject) => subject.toLowerCase());

  if (!tags.length) {
    return `Read if you want a classic perspective from ${author}.`;
  }

  return `Read if you want sharper thinking around ${tags.join(", ")}.`;
}

function buildContent(title: string, author: string, description: string, subjects: string[]) {
  const summary = firstSentence(description);

  return [
    summary
      ? `Summary: ${summary}`
      : `Summary: ${title} is a classic by ${author} that still reads like practical advice.`,
    buildBestPart(subjects, title),
    buildActionTakeaway(subjects, title),
    buildReadIf(author, subjects),
  ];
}

async function fetchSearchResult(query: string) {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set(
    "fields",
    "key,title,author_name,first_publish_year,cover_i,subject,public_scan_b",
  );
  url.searchParams.set("limit", "5");

  const response = await fetch(url, {
    headers: OPEN_LIBRARY_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Open Library search failed for ${query}`);
  }

  const payload = (await response.json()) as OpenLibrarySearchResponse;

  return (
    payload.docs?.find((doc) => {
      const publishYear = doc.first_publish_year ?? 9999;
      return Boolean(doc.key && doc.title && publishYear <= 1929);
    }) ?? null
  );
}

async function fetchWorkDetails(workKey: string) {
  const response = await fetch(`https://openlibrary.org${workKey}.json`, {
    headers: OPEN_LIBRARY_HEADERS,
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as OpenLibraryWorkResponse;
}

async function loadBookReels() {
  const reels: ExternalBookReel[] = [];

  for (const query of CURATED_BOOKS) {
    if (reels.length >= 16) {
      break;
    }

    try {
      const book = await fetchSearchResult(query);

      if (!book?.key || !book.title) {
        continue;
      }

      const work = await fetchWorkDetails(book.key);
      const author = book.author_name?.[0] ?? "Unknown author";
      const subjects = cleanSubjects(work?.subjects ?? book.subject ?? []);
      const description = normalizeDescription(work?.description);
      const coverUrl = book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
        : null;

      reels.push({
        title: `${book.title} in 4 reel notes`,
        content: buildContent(book.title, author, description, subjects),
        category: "Books",
        source: `Open Library · ${author}`,
        image_url: coverUrl,
        created_at: new Date().toISOString(),
      });
    } catch {
      continue;
    }
  }

  return reels;
}

async function upsertThroughDatabase(posts: ExternalBookReel[]) {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    for (const post of posts) {
      await client.query(
        `
          insert into public.posts (title, content, category, source, image_url, created_at)
          values ($1, $2::jsonb, $3, $4, $5, $6)
          on conflict (title) do update
          set
            content = excluded.content,
            category = excluded.category,
            source = excluded.source,
            image_url = excluded.image_url,
            created_at = excluded.created_at
        `,
        [
          post.title,
          JSON.stringify(post.content),
          post.category,
          post.source,
          post.image_url,
          post.created_at,
        ],
      );
    }
  } finally {
    await client.end();
  }
}

async function upsertThroughSupabase(posts: ExternalBookReel[]) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const { error } = await supabase.from("posts").upsert(posts, {
    onConflict: "title",
  });

  if (error) {
    throw error;
  }
}

async function run() {
  const posts = await loadBookReels();

  if (!posts.length) {
    throw new Error("No book reels were fetched from Open Library.");
  }

  if (process.env.SUPABASE_DB_URL) {
    await upsertThroughDatabase(posts);
    console.log(`Imported ${posts.length} book reels through direct database connection`);
    return;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local.");
  }

  await upsertThroughSupabase(posts);
  console.log(`Imported ${posts.length} book reels through Supabase API`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

module.exports = {};
