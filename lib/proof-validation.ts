// Proof validation — shared between client (instant feedback) and server (enforcement)

export const CATEGORIES = ["Mindset", "Gym", "Diet", "Books", "Wellness", "Finance", "Relationships"] as const;
export type ProofCategory = (typeof CATEGORIES)[number];

export const PROOF_REQUIREMENTS: Record<string, { minChars: number; hint: string; requiresNumber?: boolean }> = {
  Gym: { minChars: 40, hint: "Include exercise name and reps/weight/minutes", requiresNumber: true },
  Books: { minChars: 40, hint: "Include the book or article title and your takeaway" },
  Diet: { minChars: 30, hint: "Describe what you ate, cooked, or avoided" },
  Mindset: { minChars: 40, hint: "Describe your specific thought shift or action taken" },
  Wellness: { minChars: 30, hint: "Describe your wellness activity and how it felt" },
  Finance: { minChars: 30, hint: "Describe the financial action you took" },
  Relationships: { minChars: 30, hint: "Describe the social action you took and with whom" },
};

const DEFAULT_REQUIREMENT = { minChars: 30, hint: "Describe what you did in detail" };

const DENY_LIST = [
  "i did it", "done", "yes", "no", "test", "asdf", "completed", "finished",
  "ok", "okay", "yep", "idk", "nothing", "stuff", "things", "whatever",
  "did it", "did this", "yea", "yeah", "nah", "lol", "lmao", "haha",
  "hi", "hello", "hey", "bruh", "sus", "gg", "idc", "sure", "aight",
  "nope", "meh", "hmm", "same", "true", "false", "abc", "xyz", "qwerty",
];

function isGibberish(text: string): boolean {
  const lower = text.toLowerCase().replace(/\s/g, "");
  if (lower.length < 5) return true;

  // Check if >50% of chars are the same
  const charCounts: Record<string, number> = {};
  for (const c of lower) charCounts[c] = (charCounts[c] ?? 0) + 1;
  const maxCount = Math.max(...Object.values(charCounts));
  if (maxCount / lower.length > 0.5) return true;

  // Keyboard mash patterns
  const mashPatterns = [
    /(.)\1{4,}/, // 5+ repeated chars
    /^[asdfghjkl]+$/i,
    /^[qwertyuiop]+$/i,
    /^[zxcvbnm]+$/i,
    /^[0-9]+$/, // just numbers
  ];
  if (mashPatterns.some((p) => p.test(lower))) return true;

  // Check for minimum word variety (at least 3 distinct words for longer text)
  const words = text.trim().split(/\s+/).filter((w) => w.length > 1);
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  if (words.length >= 4 && uniqueWords.size < 3) return true;

  return false;
}

export function validateProof(
  text: string,
  category: string
): { valid: boolean; error?: string } {
  const trimmed = text.trim();
  const req = PROOF_REQUIREMENTS[category] ?? DEFAULT_REQUIREMENT;

  if (!trimmed) {
    return { valid: false, error: "Please describe what you did." };
  }

  // Check deny list
  if (DENY_LIST.includes(trimmed.toLowerCase())) {
    return { valid: false, error: "Be specific about what you actually did. Generic responses aren't accepted." };
  }

  // Check minimum length
  if (trimmed.length < req.minChars) {
    return { valid: false, error: `Too short. Minimum ${req.minChars} characters. ${req.hint}.` };
  }

  // Check gibberish
  if (isGibberish(trimmed)) {
    return { valid: false, error: "This doesn't look like a real proof. Describe your actual action." };
  }

  // Check if number required (Gym)
  if (req.requiresNumber && !/\d/.test(trimmed)) {
    return { valid: false, error: "Include a number (reps, weight, or minutes)." };
  }

  return { valid: true };
}

// Category-specific submit button labels
export const SUBMIT_LABELS: Record<string, string> = {
  Gym: "Log Workout",
  Books: "Log Reading",
  Diet: "Log Meal",
  Mindset: "Log Mindset Shift",
  Wellness: "Log Wellness",
  Finance: "Log Financial Action",
  Relationships: "Log Social Action",
};
