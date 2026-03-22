/** Curated audio tracks and background options for reels */

export type AudioTrack = {
  id: string;
  label: string;
  category: string;
  url: string;
};

/** All available audio tracks. First track per category is the default. */
export const AUDIO_TRACKS: AudioTrack[] = [
  { id: "mindset-1", label: "Alpha Focus", category: "Mindset", url: "/audio/mindset-1.wav" },
  { id: "mindset-2", label: "Clear Mind", category: "Mindset", url: "/audio/mindset-2.wav" },
  { id: "gym-1", label: "Power Drive", category: "Gym", url: "/audio/gym-1.wav" },
  { id: "gym-2", label: "Iron Will", category: "Gym", url: "/audio/gym-2.wav" },
  { id: "books-1", label: "Study Calm", category: "Books", url: "/audio/books-1.wav" },
  { id: "books-2", label: "Deep Read", category: "Books", url: "/audio/books-2.wav" },
  { id: "diet-1", label: "Fresh Uplift", category: "Diet", url: "/audio/diet-1.wav" },
  { id: "diet-2", label: "Clean Energy", category: "Diet", url: "/audio/diet-2.wav" },
  { id: "wellness-1", label: "Nature Calm", category: "Wellness", url: "/audio/wellness-1.wav" },
  { id: "wellness-2", label: "Soft Breeze", category: "Wellness", url: "/audio/wellness-2.wav" },
  { id: "finance-1", label: "Deep Focus", category: "Finance", url: "/audio/finance-1.wav" },
  { id: "finance-2", label: "Steady Flow", category: "Finance", url: "/audio/finance-2.wav" },
  { id: "relationships-1", label: "Warm Glow", category: "Relationships", url: "/audio/relationships-1.wav" },
  { id: "relationships-2", label: "Heart Space", category: "Relationships", url: "/audio/relationships-2.wav" },
];

/** Get the default audio track for a category */
export function getDefaultTrack(category: string): AudioTrack {
  return (
    AUDIO_TRACKS.find((t) => t.category === category) ??
    AUDIO_TRACKS[0]
  );
}

/** Get all tracks for a category */
export function getTracksForCategory(category: string): AudioTrack[] {
  return AUDIO_TRACKS.filter((t) => t.category === category);
}

/** Get a track by ID */
export function getTrackById(id: string): AudioTrack | undefined {
  return AUDIO_TRACKS.find((t) => t.id === id);
}

/** Curated background images for reel creation */
export type BackgroundOption = {
  id: string;
  label: string;
  type: "gradient" | "photo";
  /** For gradients: used by REEL_GRADIENTS */
  gradientKey?: string;
  /** For photos: URL to the image */
  url?: string;
  /** CSS for the preview swatch */
  previewCss: string;
};

export const CURATED_BACKGROUNDS: BackgroundOption[] = [
  // Gradients (match REEL_GRADIENTS keys)
  { id: "g-ocean", label: "Ocean", type: "gradient", gradientKey: "ocean", previewCss: "linear-gradient(135deg, #0c4a6e, #0f172a)" },
  { id: "g-sunset", label: "Sunset", type: "gradient", gradientKey: "sunset", previewCss: "linear-gradient(135deg, #7c2d12, #1c0a00)" },
  { id: "g-forest", label: "Forest", type: "gradient", gradientKey: "forest", previewCss: "linear-gradient(135deg, #064e3b, #0d1f1a)" },
  { id: "g-aurora", label: "Aurora", type: "gradient", gradientKey: "aurora", previewCss: "linear-gradient(135deg, #4c1d95, #0f0a1e)" },
  { id: "g-ember", label: "Ember", type: "gradient", gradientKey: "ember", previewCss: "linear-gradient(135deg, #7f1d1d, #0f0a0a)" },
  { id: "g-royal", label: "Royal", type: "gradient", gradientKey: "royal", previewCss: "linear-gradient(135deg, #1e1b4b, #0c0a1e)" },
  // Extended gradients
  { id: "g-midnight", label: "Midnight", type: "gradient", gradientKey: "midnight", previewCss: "linear-gradient(135deg, #0f172a, #020617)" },
  { id: "g-rose", label: "Rose", type: "gradient", gradientKey: "rose", previewCss: "linear-gradient(135deg, #4c0519, #0c0005)" },
  { id: "g-mint", label: "Mint", type: "gradient", gradientKey: "mint", previewCss: "linear-gradient(135deg, #064e3b, #022c22)" },
  { id: "g-solar", label: "Solar", type: "gradient", gradientKey: "solar", previewCss: "linear-gradient(135deg, #78350f, #1c0a00)" },
  { id: "g-cosmic", label: "Cosmic", type: "gradient", gradientKey: "cosmic", previewCss: "linear-gradient(135deg, #312e81, #0c0a2e)" },
  { id: "g-storm", label: "Storm", type: "gradient", gradientKey: "storm", previewCss: "linear-gradient(135deg, #1e3a5f, #0a0f1a)" },
  // Curated photos (Unsplash — free to use, stable URLs)
  { id: "p-mountain", label: "Mountain", type: "photo", url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80", previewCss: "url(https://images.unsplash.com/photo-1519681393784-d120267933ba?w=100&q=40) center/cover" },
  { id: "p-ocean-wave", label: "Ocean Wave", type: "photo", url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80", previewCss: "url(https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=100&q=40) center/cover" },
  { id: "p-forest-path", label: "Forest Path", type: "photo", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80", previewCss: "url(https://images.unsplash.com/photo-1448375240586-882707db888b?w=100&q=40) center/cover" },
  { id: "p-sunset-sky", label: "Sunset Sky", type: "photo", url: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&q=80", previewCss: "url(https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=100&q=40) center/cover" },
  { id: "p-stars", label: "Stars", type: "photo", url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80", previewCss: "url(https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=100&q=40) center/cover" },
  { id: "p-city-lights", label: "City Lights", type: "photo", url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80", previewCss: "url(https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=100&q=40) center/cover" },
  { id: "p-gym-dark", label: "Dark Gym", type: "photo", url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80", previewCss: "url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&q=40) center/cover" },
  { id: "p-books-shelf", label: "Book Shelf", type: "photo", url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80", previewCss: "url(https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=100&q=40) center/cover" },
];
