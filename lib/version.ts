// Build version — BUILD_DATE auto-generated at build time via next.config.mjs
export const BUILD_NUMBER = "v1.20";
export const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP ?? "28 Mar 2026 IST";
export const BUILD_VERSION = `${BUILD_NUMBER} · ${BUILD_DATE} IST`;

export const LATEST_CHANGES = [
  "Content Collector: daily auto-collection from Guardian + Reddit with images",
  "Admin Dashboard: user management, content moderation, manual collection trigger",
  "Proof Hardening: 90s cooldown, category-specific validation, anti-gibberish",
  "Fixed: update popup no longer loops on every deploy",
  "How to Play card: now collapsible (expand/collapse/dismiss)",
  "Light mode: fixed all broken colors across challenge page and leaderboard",
  "Rate limit: max 10 proofs per hour",
];
