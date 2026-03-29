// Maps collected content items into Liftly post format for DB insertion

import { REEL_GRADIENTS } from "@/lib/types";
import type { GuardianArticle } from "./guardian";
import type { RedditArticle } from "./reddit";

const CATEGORY_GRADIENTS: Record<string, string> = {
  Mindset: "sunset",
  Gym: "emerald",
  Diet: "ocean",
  Books: "purple",
  Wellness: "mint",
  Finance: "gold",
  Relationships: "rose",
  "Technology & AI": "neon",
  Business: "gold",
  "World News": "ocean",
  Science: "purple",
  Sport: "emerald",
  Environment: "mint",
  "Health & Life": "rose",
  "Money & Finance": "gold",
  Culture: "sunset",
  Education: "purple",
};

const SUGGESTED_ACTIONS: Record<string, string> = {
  Mindset: "Reflect on this and write your key insight or mindset shift",
  Gym: "Try this exercise routine and log your reps, sets, or duration",
  Diet: "Try this meal idea or nutrition tip and describe what you prepared",
  Books: "Read this and write your main takeaway in your own words",
  Wellness: "Try this wellness practice today and describe how it felt",
  Finance: "Apply this financial tip and describe the action you took",
  Relationships: "Practice this social skill today and describe the interaction",
};

// Map Guardian section labels to Liftly categories
const GUARDIAN_TO_LIFTLY: Record<string, string> = {
  "Technology & AI": "Mindset",
  Business: "Finance",
  "World News": "Mindset",
  Science: "Mindset",
  Sport: "Gym",
  Environment: "Wellness",
  "Health & Life": "Wellness",
  "Money & Finance": "Finance",
  Culture: "Mindset",
  Education: "Books",
};

type CollectedPost = {
  title: string;
  content: string[];
  category: string;
  source: string;
  image_url: string | null;
  suggested_action: string;
  gradient: string;
  tags: string[];
  author_id: null;
  is_user_created: false;
};

function pickGradient(category: string): string {
  const key = CATEGORY_GRADIENTS[category] ?? "ocean";
  return key in REEL_GRADIENTS ? key : "ocean";
}

export function mapGuardianToPost(article: GuardianArticle): CollectedPost {
  const liftlyCategory = GUARDIAN_TO_LIFTLY[article.category] ?? "Mindset";
  const content: string[] = [];
  if (article.description) content.push(article.description);

  return {
    title: article.title,
    content,
    category: liftlyCategory,
    source: `The Guardian · ${article.category}`,
    image_url: article.image_url,
    suggested_action: SUGGESTED_ACTIONS[liftlyCategory] ?? SUGGESTED_ACTIONS.Mindset,
    gradient: pickGradient(article.category),
    tags: [liftlyCategory.toLowerCase(), "news"],
    author_id: null,
    is_user_created: false,
  };
}

export function mapRedditToPost(article: RedditArticle): CollectedPost {
  const content: string[] = [];
  if (article.description) content.push(article.description);

  return {
    title: article.title,
    content,
    category: article.category,
    source: `Reddit · ${article.source}`,
    image_url: article.image_url,
    suggested_action: SUGGESTED_ACTIONS[article.category] ?? SUGGESTED_ACTIONS.Mindset,
    gradient: pickGradient(article.category),
    tags: [article.category.toLowerCase(), "community"],
    author_id: null,
    is_user_created: false,
  };
}

// Generate synthetic reel to fill category gaps
const CATEGORY_TEMPLATES: Record<string, { titles: string[]; contents: string[] }> = {
  Gym: {
    titles: [
      "5-Minute Morning Stretching Routine",
      "Progressive Strength Training Basics",
      "Bodyweight Exercises for Beginners",
      "HIIT Cardio Workout at Home",
      "Recovery Routine for Sore Muscles",
    ],
    contents: [
      "Start your day with dynamic stretching to improve flexibility and wake up your muscles. Spend 2 minutes on each major muscle group.",
      "Building strength is simple: pick 3 exercises, do 3 sets of 8-12 reps, rest 2-3 minutes between sets. Progressive overload is key.",
      "Push-ups, squats, lunges, and planks require zero equipment. Start with 3 sets of 10 and adjust from there.",
      "Alternate 20 seconds of high-intensity work with 10 seconds of rest for 20 minutes. No equipment needed.",
      "Foam rolling and stretching after workouts reduce soreness. Spend 15 minutes cooling down properly.",
    ],
  },
  Diet: {
    titles: [
      "Meal Prep 101: Simple Weekly Routine",
      "Intermittent Fasting Basics",
      "Hydration Tips for Better Health",
      "Budget-Friendly Nutritious Meals",
      "Protein-Packed Breakfast Ideas",
    ],
    contents: [
      "Spend 2 hours on Sunday preparing 5 meals. Use containers, freeze, and enjoy healthy food all week without stress.",
      "Start with a 14:10 fasting window—fast for 14 hours, eat within 10 hours. Listen to your body and adjust.",
      "Drink half your body weight in ounces of water daily. Add lemon for taste. Track intake with a water bottle.",
      "Rice, beans, eggs, and frozen vegetables are cheap and nutritious. Build a base, add seasonings for flavor.",
      "Eggs, Greek yogurt, oats, and berries make fast, filling breakfasts packed with protein. Mix and match daily.",
    ],
  },
  Books: {
    titles: [
      "How to Build a Reading Habit",
      "Top Non-Fiction Books for Self-Growth",
      "Speed Reading Techniques That Work",
      "Starting Your Book Club",
      "Fiction That Changes Your Perspective",
    ],
    contents: [
      "Read 15 minutes daily—morning coffee, lunch break, or before bed. Consistency beats long sessions.",
      "Atomic Habits, The 7 Habits, and Mindset are classics. Pick one, read fully, and apply one idea.",
      "Focus on the main ideas, not every word. Use a finger guide and limit subvocalization. Practice builds speed.",
      "Find 3-5 friends, pick a book, set a date. Discuss key ideas and perspectives. Book clubs deepen understanding.",
      "Educated, Circe, and The Midnight Library offer fresh viewpoints. Read reviews, pick your genre, dive in.",
    ],
  },
  Wellness: {
    titles: [
      "10-Minute Meditation for Beginners",
      "Sleep Hygiene: The Complete Guide",
      "Stress Management Techniques",
      "Mindfulness Practices Daily",
      "Breathing Exercises for Calm",
    ],
    contents: [
      "Find a quiet spot, close your eyes, focus on your breath. Start with 5 minutes. Apps like Insight Timer help.",
      "No screens 1 hour before bed. Cool, dark room. Consistent sleep schedule. Aim for 7-9 hours. This changes everything.",
      "Exercise, journaling, time in nature, and talking to friends all reduce stress. Pick two and build a routine.",
      "Mindful eating: chew slowly, taste fully. Mindful walking: notice sounds, textures, smells. Simple but powerful.",
      "Box breathing: inhale 4, hold 4, exhale 4. Repeat 5 times when stressed. Instantly calming.",
    ],
  },
  Finance: {
    titles: [
      "Budgeting Framework: 50/30/20 Rule",
      "Building an Emergency Fund",
      "Passive Income Ideas for Beginners",
      "Investing in Index Funds",
      "Debt Payoff Strategies That Work",
    ],
    contents: [
      "Spend 50% on needs, 30% on wants, 20% on savings. Simple, effective, sustainable. Track monthly.",
      "Save 3-6 months of expenses. Start with $500, then $1,000, keep growing. This is your safety net.",
      "Rental income, dividends, and side gigs generate passive income. Start small, automate, scale over time.",
      "Low-cost index funds have 7-10% average annual returns. Start with $100 and invest regularly.",
      "Debt snowball: pay smallest first, then roll payments. Or avalanche: highest interest first. Both work—pick one.",
    ],
  },
  Relationships: {
    titles: [
      "Effective Communication Skills",
      "Setting Healthy Boundaries",
      "Active Listening Techniques",
      "Conflict Resolution That Works",
      "Building Strong Friendships",
    ],
    contents: [
      "Say what you mean clearly. Use 'I feel' instead of 'you always.' Listen without interrupting. This transforms conversations.",
      "Say no without guilt. Explain calmly. Stick to your limits. Respect them too. Healthy relationships need boundaries.",
      "Focus fully, nod, ask questions, don't plan your response. People feel heard. Conversations deepen naturally.",
      "Acknowledge both perspectives. Find common ground. Take a break if heated. Come back when calm. Most issues resolve.",
      "Consistent effort, showing up, and genuine interest build friendships. Schedule regular check-ins. Invest in them.",
    ],
  },
  Mindset: {
    titles: [
      "The Growth Mindset Framework",
      "Overcoming Limiting Beliefs",
      "Daily Affirmations That Stick",
      "Gratitude Practice for Happiness",
      "Building Resilience Through Adversity",
    ],
    contents: [
      "Abilities grow with effort. Challenges are opportunities. Failures teach lessons. Embrace 'yet'—you haven't succeeded yet.",
      "Write down beliefs holding you back. Challenge each one. Replace with empowering alternatives. Practice daily.",
      "Write 3 affirmations daily. 'I am capable.' 'I am worthy.' 'I am growing.' Repeat in mirror. Feel the shift.",
      "Write 3 things you're grateful for daily. Gratitude rewires your brain toward positivity and abundance.",
      "Resilience is built by facing challenges. Start small, reflect on lessons, adjust, try again. Each attempt builds strength.",
    ],
  },
};

export function generateCategoryReel(category: string): CollectedPost {
  const templates = CATEGORY_TEMPLATES[category];
  if (!templates) {
    // Fallback to generic Mindset reel
    return generateCategoryReel("Mindset");
  }

  const titleIdx = Math.floor(Math.random() * templates.titles.length);
  const contentIdx = Math.floor(Math.random() * templates.contents.length);

  return {
    title: templates.titles[titleIdx],
    content: [templates.contents[contentIdx]],
    category,
    source: "Liftly Curator",
    image_url: null,
    suggested_action: SUGGESTED_ACTIONS[category] ?? SUGGESTED_ACTIONS.Mindset,
    gradient: pickGradient(category),
    tags: [category.toLowerCase(), "curated"],
    author_id: null,
    is_user_created: false,
  };
}
