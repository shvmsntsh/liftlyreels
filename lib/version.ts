// Build version — BUILD_DATE auto-generated at build time via next.config.mjs
export const BUILD_NUMBER = "v1.19";
export const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP ?? "28 Mar 2026 IST";
export const BUILD_VERSION = `${BUILD_NUMBER} · ${BUILD_DATE} IST`;

export const LATEST_CHANGES = [
  "World Reel: real article images with fallback, clean text (no HTML tags)",
  "Fixed: content no longer cut off behind bottom nav",
  "Fixed: sound button no longer overlaps close button in World Reel",
  "Audio settings now sync between Settings page and feed",
  "Reaction buttons: clean circular highlight instead of boxy background",
  "Proved reels stay proved across reloads — no duplicate proofs",
  "Build timestamp now auto-generated in IST",
];
