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
