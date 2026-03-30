import { decode } from "./guardian";

type ContentMeta = {
  title?: string;
  category?: string;
  source?: string;
};

function stripMarkup(raw: string) {
  return decode(raw)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, ". ")
    .replace(/<\/p>/gi, ". ")
    .replace(/<li[^>]*>/gi, " ")
    .replace(/<\/li>/gi, ". ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\bSC_OFF\b/gi, " ")
    .replace(/\bclass\s*=\s*["'][^"']*["']/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSentence(value: string) {
  return stripMarkup(value)
    .replace(/^[•\-\d.)\s]+/, "")
    .replace(/\s*([,.!?;:])\s*/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map(cleanSentence)
    .filter((part) => part.length >= 18);
}

function capPoint(text: string, maxLength = 120) {
  if (text.length <= maxLength) return text;
  const clipped = text.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 50 ? lastSpace : maxLength).trim()}...`;
}

function fallbackPoints(meta: ContentMeta) {
  const title = cleanSentence(meta.title ?? "A useful idea");
  const category = cleanSentence(meta.category ?? "Mindset");
  const source = cleanSentence(meta.source ?? "Liftly");

  return [
    `${title}.`,
    `Key takeaway: turn this ${category.toLowerCase()} idea into one clear action today.`,
    `Source: ${source}.`,
  ];
}

export function normalizeCollectedContent(raw: string | string[], meta: ContentMeta = {}) {
  const text = Array.isArray(raw)
    ? raw.map((item) => stripMarkup(item)).join(" ")
    : stripMarkup(raw);

  const points = splitSentences(text)
    .slice(0, 3)
    .map((sentence) => capPoint(sentence));

  if (points.length >= 2) {
    return points;
  }

  const merged = [...points];
  for (const point of fallbackPoints(meta)) {
    if (merged.length >= 3) break;
    if (!merged.some((existing) => existing.toLowerCase() === point.toLowerCase())) {
      merged.push(capPoint(point));
    }
  }

  return merged.slice(0, 3);
}

export function normalizeCollectedTitle(title: string) {
  return cleanSentence(title).slice(0, 120) || "Untitled";
}

export function normalizeCollectedSource(source: string) {
  return cleanSentence(source) || "Liftly";
}
