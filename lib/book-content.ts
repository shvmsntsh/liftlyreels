import { PostRecord } from "@/lib/types";

type OpenLibrarySearchDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
  public_scan_b?: boolean;
};

type OpenLibrarySearchResponse = {
  docs?: OpenLibrarySearchDoc[];
};

type OpenLibraryWorkResponse = {
  description?: string | { value?: string };
  subjects?: string[];
};

export type ExternalBookReel = Omit<PostRecord, "id">;

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

function normalizeDescription(description?: string | { value?: string }) {
  if (!description) {
    return "";
  }

  const raw = typeof description === "string" ? description : description.value ?? "";

  return raw
    .replace(/\s+/g, " ")
    .replace(/\[[^\]]+\]/g, "")
    .trim();
}

function firstSentence(text: string) {
  if (!text) {
    return "";
  }

  const [sentence] = text.split(/(?<=[.!?])\s+/);
  return sentence?.trim() ?? "";
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function cleanSubjects(subjects: string[] = []) {
  return subjects
    .filter((subject) => subject && !subject.includes("Accessible book"))
    .map((subject) => subject.replace(/\s+/g, " ").trim())
    .slice(0, 6);
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

export async function fetchCuratedBookReels(limit = 12): Promise<ExternalBookReel[]> {
  const reels: ExternalBookReel[] = [];

  for (const query of CURATED_BOOKS) {
    if (reels.length >= limit) {
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
        source: `Open Library · ${toTitleCase(author)}`,
        image_url: coverUrl,
        author_id: null,
        is_user_created: false,
        tags: [],
        views_count: 0,
        gradient: "ocean",
        audio_track: null,
        created_at: new Date().toISOString(),
      });
    } catch {
      continue;
    }
  }

  return reels;
}
