/**
 * Positive Content Aggregator API
 * Pulls from multiple free public APIs to seed the app with uplifting content.
 * Sources: ZenQuotes, Advice Slip, NASA APOD, Open Library, Stoic quotes
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const GRADIENT_CYCLE = ["ocean", "sunset", "forest", "aurora", "ember"];

async function fetchZenQuotes(): Promise<Array<{ title: string; content: string[]; category: string; gradient: string }>> {
  try {
    const res = await fetch("https://zenquotes.io/api/quotes", { next: { revalidate: 3600 } });
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.slice(0, 5).map((q: { q: string; a: string }, i: number) => ({
      title: q.q.slice(0, 80),
      content: [
        `"${q.q}"`,
        `— ${q.a}`,
        "Sit with this for 60 seconds. Let it land.",
        "Great wisdom often takes time to fully absorb.",
      ],
      category: "Mindset",
      gradient: GRADIENT_CYCLE[i % GRADIENT_CYCLE.length],
    }));
  } catch {
    return [];
  }
}

async function fetchStoicQuotes(): Promise<Array<{ title: string; content: string[]; category: string; gradient: string }>> {
  try {
    const quotes = [
      {
        quote: "You have power over your mind, not outside events. Realize this, and you will find strength.",
        author: "Marcus Aurelius",
      },
      {
        quote: "He who fears death will never do anything worthy of a living man.",
        author: "Seneca",
      },
      {
        quote: "Waste no more time arguing about what a good person should be. Be one.",
        author: "Marcus Aurelius",
      },
      {
        quote: "We suffer more often in imagination than in reality.",
        author: "Seneca",
      },
      {
        quote: "The happiness of your life depends upon the quality of your thoughts.",
        author: "Marcus Aurelius",
      },
    ];

    return quotes.map((q, i) => ({
      title: q.quote.slice(0, 80),
      content: [
        `"${q.quote}"`,
        `— ${q.author}`,
        "Stoic philosophy: focus only on what is within your control.",
        "This quote has survived 2,000 years because it works.",
      ],
      category: "Mindset",
      gradient: GRADIENT_CYCLE[(i + 2) % GRADIENT_CYCLE.length],
    }));
  } catch {
    return [];
  }
}

async function fetchNasaAPOD(): Promise<Array<{ title: string; content: string[]; category: string; gradient: string; image_url?: string }> | null> {
  const apiKey = process.env.NASA_API_KEY ?? "DEMO_KEY";
  try {
    const res = await fetch(
      `https://api.nasa.gov/planetary/apod?count=3&api_key=${apiKey}`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    return data
      .filter((item: { media_type: string }) => item.media_type === "image")
      .map((item: { title: string; explanation: string; url: string }) => ({
        title: `Universe View: ${item.title.slice(0, 60)}`,
        content: [
          item.explanation.slice(0, 100) + "...",
          "The universe is 13.8 billion years old. Your problems are solvable.",
          "Perspective: every atom in your body was forged in a star.",
          "Zoom out. You are made of ancient cosmic material.",
        ],
        category: "Mindset",
        gradient: "aurora",
        image_url: item.url,
      }));
  } catch {
    return null;
  }
}

async function fetchPositiveLifeAdvice(): Promise<Array<{ title: string; content: string[]; category: string; gradient: string }>> {
  // Curated positive life advice reels
  return [
    {
      title: "The 5-minute rule for hard tasks",
      content: [
        "Tell yourself you'll only do it for 5 minutes.",
        "Starting is 90% of the battle — momentum takes over.",
        "You almost always continue past 5 minutes once started.",
        "The brain fears the task more than it fears the work itself.",
        "This trick works because commitment feels smaller than the full task.",
      ],
      category: "Mindset",
      gradient: "ocean",
    },
    {
      title: "Compound learning: 15 minutes a day",
      content: [
        "15 min/day = 91 hours of learning per year.",
        "That's two full university courses worth of knowledge.",
        "Chose your topic. Read. Listen. Watch. Teach.",
        "The topic matters less than the habit of learning.",
        "Your future self will be unrecognizable after one year of this.",
      ],
      category: "Books",
      gradient: "forest",
    },
    {
      title: "Protein at breakfast changes everything",
      content: [
        "30g+ protein at breakfast reduces cravings for 6+ hours.",
        "Eggs, Greek yogurt, or a shake all work equally well.",
        "Blood sugar stabilizes, making afternoon decisions sharper.",
        "This one habit has a cascade effect on your entire day.",
      ],
      category: "Diet",
      gradient: "sunset",
    },
    {
      title: "Train for performance, not aesthetics",
      content: [
        "When you train to be strong, aesthetic follows naturally.",
        "Performance goals (deadlift 2x bodyweight) are concrete and motivating.",
        "Aesthetics can disappear with life stress. Strength stays.",
        "Focus on what your body can DO, not just how it looks.",
      ],
      category: "Gym",
      gradient: "ember",
    },
    {
      title: "The science of sleep optimization",
      content: [
        "Keep wake time consistent, even on weekends.",
        "Room temp 65–68°F (18–20°C) is optimal for deep sleep.",
        "Last caffeine 9 hours before bed — yes, 9 hours.",
        "One bad sleep doesn't ruin your health. Pattern does.",
      ],
      category: "Wellness",
      gradient: "aurora",
    },
  ];
}

export async function GET() {
  try {
    const [zenQuotes, stoicQuotes, nasaReels, lifeAdvice] = await Promise.all([
      fetchZenQuotes(),
      fetchStoicQuotes(),
      fetchNasaAPOD(),
      fetchPositiveLifeAdvice(),
    ]);

    const allReels = [
      ...zenQuotes,
      ...stoicQuotes,
      ...(nasaReels ?? []),
      ...lifeAdvice,
    ];

    return NextResponse.json({ reels: allReels, count: allReels.length });
  } catch {
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}

export async function POST() {
  // Seed database with fresh positive content from APIs
  try {
    const response = await GET();
    const { reels } = await response.json();

    const supabase = createSupabaseServerClient();

    let inserted = 0;
    for (const reel of reels) {
      const { error } = await supabase.from("posts").insert({
        title: reel.title,
        content: reel.content,
        category: reel.category,
        source: getSourceLabel(reel.title),
        gradient: reel.gradient,
        image_url: reel.image_url ?? null,
        is_user_created: false,
      });
      if (!error) inserted++;
    }

    return NextResponse.json({ success: true, inserted });
  } catch {
    return NextResponse.json({ error: "Failed to seed content" }, { status: 500 });
  }
}

function getSourceLabel(title: string): string {
  if (title.startsWith("Universe View")) return "NASA APOD";
  if (title.includes("Marcus Aurelius") || title.includes("Seneca")) return "Stoic Philosophy";
  return "Positive Feed";
}
