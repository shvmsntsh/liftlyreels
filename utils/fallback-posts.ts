import { PostRecord } from "@/lib/types";

const now = Date.now();

const BASE = {
  author_id: null,
  author: null,
  is_user_created: false,
  tags: [],
  views_count: 0,
  reactions_summary: { sparked: 0, fired_up: 0, bookmarked: 0 },
  user_reactions: [],
  comments_count: 0,
};

const fallbackPosts: PostRecord[] = [
  {
    ...BASE,
    id: "fallback-1",
    title: "Stop solving imaginary problems",
    content: [
      "Most stress starts with scenarios that never happen.",
      "Write down the next real action before your mind spirals.",
      "Energy grows when your focus becomes concrete.",
      "Clarity beats intensity every single day.",
    ],
    category: "Mindset",
    source: "Daily Practice",
    image_url:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
    gradient: "aurora",
    created_at: new Date(now).toISOString(),
  },
  {
    ...BASE,
    id: "fallback-2",
    title: "Muscle comes from boring consistency",
    content: [
      "The winning plan is the one you can repeat next week.",
      "Track your main lifts and add tiny improvements.",
      "Missed workouts matter less than quitting after one miss.",
      "Recovery is part of the program, not an excuse from it.",
    ],
    category: "Gym",
    source: "Coaching Note",
    image_url:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
    gradient: "ember",
    created_at: new Date(now - 60_000).toISOString(),
  },
  {
    ...BASE,
    id: "fallback-3",
    title: "Diet success starts with easier defaults",
    content: [
      "Build meals around protein first and snacks get quieter.",
      "If healthy food is visible, decision fatigue drops fast.",
      "You do not need perfect macros to make progress.",
      "Simple meals beat elaborate plans you never repeat.",
    ],
    category: "Diet",
    source: "Nutrition Guide",
    image_url:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
    gradient: "forest",
    created_at: new Date(now - 120_000).toISOString(),
  },
  {
    ...BASE,
    id: "fallback-4",
    title: "Read for implementation, not completion",
    content: [
      "One applied idea is worth more than ten highlighted pages.",
      "Summarize the chapter in your own words immediately.",
      "Turn every book into one habit, rule, or checklist.",
      "Useful reading changes your calendar, not just your notes.",
    ],
    category: "Books",
    source: "Reading System",
    image_url:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
    gradient: "ocean",
    created_at: new Date(now - 180_000).toISOString(),
  },
  {
    ...BASE,
    id: "fallback-5",
    title: "High performers protect their mornings",
    content: [
      "The first hour decides whether you react or create.",
      "Avoid instant inputs before your own priorities are clear.",
      "Start with one task that compounds over time.",
      "Momentum is easier to keep than to rebuild later.",
    ],
    category: "Mindset",
    source: "Focus Notes",
    image_url:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    gradient: "sunset",
    created_at: new Date(now - 240_000).toISOString(),
  },
  {
    ...BASE,
    id: "fallback-6",
    title: "Small habits deserve visible scoreboards",
    content: [
      "What gets tracked becomes easier to repeat.",
      "Use simple checkmarks instead of complicated systems.",
      "A streak is motivation you can see.",
      "Review weekly so the habit stays connected to results.",
    ],
    category: "Books",
    source: "Atomic Habits Notes",
    image_url:
      "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80",
    gradient: "ocean",
    created_at: new Date(now - 300_000).toISOString(),
  },
];

export function getFallbackPosts() {
  return fallbackPosts;
}
