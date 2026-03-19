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
  created_at: string;
  reactions_summary?: ReactionSummary;
  user_reactions?: ReactionType[];
  comments_count?: number;
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

export const REEL_GRADIENTS: Record<string, { from: string; to: string; label: string }> = {
  ocean: { from: "#0c4a6e", to: "#0f172a", label: "Ocean" },
  sunset: { from: "#7c2d12", to: "#1c0a00", label: "Sunset" },
  forest: { from: "#064e3b", to: "#0d1f1a", label: "Forest" },
  aurora: { from: "#4c1d95", to: "#0f0a1e", label: "Aurora" },
  ember: { from: "#7f1d1d", to: "#0f0a0a", label: "Ember" },
};
