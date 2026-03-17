const { config } = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

config({ path: ".env.local" });

type SeedPost = {
  title: string;
  content: string[];
  category: string;
  source: string;
  image_url: string;
  created_at: string;
};

const categories = [
  {
    name: "Books",
    source: "Book",
    image:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
    titles: [
      "Read for leverage, not applause",
      "Notes are useless until they change behavior",
      "One chapter can fix a weak system",
      "Underline less and apply more",
      "Borrow frameworks, not just quotes",
      "Books compress years into a weekend",
      "Re-read the pages that move your actions",
    ],
    bullets: [
      "Take one idea and turn it into a weekly rule.",
      "A short summary is more useful than scattered highlights.",
      "Good books shorten your trial-and-error cycle.",
      "Reading compounds when you revisit and implement.",
    ],
  },
  {
    name: "Gym",
    source: "Coach",
    image:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
    titles: [
      "Strength follows repeatable sessions",
      "Progressive overload is still the main event",
      "Most plateaus are recovery problems",
      "Train hard enough to adapt, not to impress",
      "Good form keeps consistency alive",
      "Do the basics until they look elite",
      "Your split matters less than your effort quality",
    ],
    bullets: [
      "Keep a logbook and beat one number at a time.",
      "Sleep and protein support the reps you want tomorrow.",
      "A simple plan wins when life gets noisy.",
      "Technique under fatigue matters more than hype.",
    ],
  },
  {
    name: "Diet",
    source: "Guide",
    image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
    titles: [
      "Build meals around protein and fiber",
      "Hunger gets louder when routine gets weaker",
      "Convenience foods shape your physique by default",
      "Sustainable eating looks boring on purpose",
      "You do not need a reset, just structure",
      "Prep beats motivation on busy days",
      "Calories matter, but systems matter first",
    ],
    bullets: [
      "Repeat meals that make good choices easier.",
      "Shop with a plan so willpower is not your strategy.",
      "A consistent breakfast can stabilize the rest of the day.",
      "Keep healthy defaults within arm's reach.",
    ],
  },
  {
    name: "Mindset",
    source: "Lesson",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    titles: [
      "Peace comes from choosing fewer priorities",
      "Your attention is your real daily budget",
      "Confidence grows after evidence, not before",
      "Clarity removes more fear than motivation does",
      "You can feel uncertain and still move forward",
      "Stress shrinks when decisions get simpler",
      "Momentum is built by starting small on purpose",
    ],
    bullets: [
      "Stop negotiating with the task and begin the first minute.",
      "Most overthinking disappears once action becomes visible.",
      "Protect your focus before you try to scale it.",
      "The next useful move is enough for now.",
    ],
  },
];

function buildSeedPosts(): SeedPost[] {
  const posts: SeedPost[] = [];

  categories.forEach((category, categoryIndex) => {
    category.titles.forEach((title, titleIndex) => {
      posts.push({
        title,
        content: category.bullets,
        category: category.name,
        source: category.source,
        image_url: category.image,
        created_at: new Date(
          Date.now() - (categoryIndex * 7 + titleIndex) * 60_000,
        ).toISOString(),
      });
    });
  });

  return posts.slice(0, 28);
}

async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const posts = buildSeedPosts();
  const { error } = await supabase.from("posts").upsert(posts, {
    onConflict: "title",
  });

  if (error) {
    throw error;
  }

  console.log(`Seeded ${posts.length} posts`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
