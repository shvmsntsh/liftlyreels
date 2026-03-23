export type PostRecord = {
  id: string;
  title: string;
  content: string[];
  category: string;
  source: string;
  image_url: string | null;
  author_id: string | null;
  author?: ProfileRecord | null;
  is_user_created: boolean;
  tags: string[];
  views_count: number;
  gradient: string;
  audio_track: string | null;
  created_at: string;
  reactions_summary?: ReactionSummary;
  user_reactions?: ReactionType[];
  comments_count?: number;
  author_is_following?: boolean;
};

export type ProfileRecord = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  vibe_score: number;
  streak_current: number;
  streak_longest: number;
  streak_last_active: string | null;
  invite_code: string | null;
  created_at: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_following?: boolean;
};

export type ReactionSummary = {
  sparked: number;
  fired_up: number;
  bookmarked: number;
};

export type ReactionType = "sparked" | "fired_up" | "bookmarked";

export type CommentRecord = {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  profile?: ProfileRecord | null;
};

export type DailyChallenge = {
  id: string;
  date: string;
  challenge_text: string;
  completions_count: number;
  post_id: string | null;
  post?: PostRecord | null;
  user_completed?: boolean;
};

export type ImpactEntry = {
  id: string;
  user_id: string;
  post_id: string;
  action_taken: string;
  created_at: string;
  post?: PostRecord | null;
};

export const CATEGORIES = [
  "Mindset",
  "Gym",
  "Diet",
  "Books",
  "Wellness",
  "Finance",
  "Relationships",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Challenge badge tiers — unlocked by total challenge completions
export const CHALLENGE_BADGES = [
  { name: "Rookie", min: 0, icon: "🌱", color: "#94a3b8" },
  { name: "Bronze", min: 7, icon: "🥉", color: "#cd7f32" },
  { name: "Silver", min: 30, icon: "🥈", color: "#c0c0c0" },
  { name: "Gold", min: 100, icon: "🥇", color: "#fbbf24" },
  { name: "Diamond", min: 365, icon: "💎", color: "#60a5fa" },
  { name: "Legend", min: 1000, icon: "👑", color: "#f59e0b" },
] as const;

export function getBadge(completions: number) {
  for (let i = CHALLENGE_BADGES.length - 1; i >= 0; i--) {
    if (completions >= CHALLENGE_BADGES[i].min) return CHALLENGE_BADGES[i];
  }
  return CHALLENGE_BADGES[0];
}

export function getNextBadge(completions: number) {
  for (const badge of CHALLENGE_BADGES) {
    if (completions < badge.min) return badge;
  }
  return null;
}

// Streak ranks — based on consecutive active days
export const STREAK_RANKS = [
  { name: "Rookie", min: 0, icon: "🌱", color: "#94a3b8" },
  { name: "Warrior", min: 3, icon: "⚔️", color: "#f97316" },
  { name: "Champion", min: 7, icon: "🏆", color: "#eab308" },
  { name: "Legend", min: 14, icon: "🔥", color: "#ef4444" },
  { name: "Immortal", min: 30, icon: "⭐", color: "#a855f7" },
] as const;

export function getStreakRank(streak: number) {
  for (let i = STREAK_RANKS.length - 1; i >= 0; i--) {
    if (streak >= STREAK_RANKS[i].min) return STREAK_RANKS[i];
  }
  return STREAK_RANKS[0];
}

export function getNextStreakRank(streak: number) {
  for (const rank of STREAK_RANKS) {
    if (streak < rank.min) return rank;
  }
  return null;
}

export const REEL_GRADIENTS: Record<string, { from: string; to: string; label: string }> = {
  ocean: { from: "#0c4a6e", to: "#0f172a", label: "Ocean" },
  sunset: { from: "#7c2d12", to: "#1c0a00", label: "Sunset" },
  forest: { from: "#064e3b", to: "#0d1f1a", label: "Forest" },
  aurora: { from: "#4c1d95", to: "#0f0a1e", label: "Aurora" },
  ember: { from: "#7f1d1d", to: "#0f0a0a", label: "Ember" },
  royal: { from: "#1e1b4b", to: "#0c0a1e", label: "Royal" },
  midnight: { from: "#0f172a", to: "#020617", label: "Midnight" },
  rose: { from: "#4c0519", to: "#0c0005", label: "Rose" },
  mint: { from: "#064e3b", to: "#022c22", label: "Mint" },
  solar: { from: "#78350f", to: "#1c0a00", label: "Solar" },
  cosmic: { from: "#312e81", to: "#0c0a2e", label: "Cosmic" },
  storm: { from: "#1e3a5f", to: "#0a0f1a", label: "Storm" },
};
