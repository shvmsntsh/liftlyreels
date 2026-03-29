import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  GUARDIAN_SECTIONS,
  decode,
  fetchSectionArticles,
  type GuardianSection,
} from "@/lib/content-sources/guardian";

export const dynamic = "force-dynamic";

// Map Liftly proof categories to Guardian sections for personalization
const CATEGORY_MAP: Record<string, string> = {
  Gym: "sport",
  Books: "education",
  Diet: "lifeandstyle",
  Mindset: "lifeandstyle",
  Wellness: "lifeandstyle",
  Finance: "money",
  Relationships: "culture",
};

// Personalization: reorder sections by user's proof categories
function reorderSections(userCategories: string[]) {
  const preferredIds = userCategories
    .map((c) => CATEGORY_MAP[c])
    .filter(Boolean);

  const sorted = [...GUARDIAN_SECTIONS].sort((a, b) => {
    const ai = preferredIds.indexOf(a.id);
    const bi = preferredIds.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return sorted;
}

// GET /api/news-reel
export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userCategories = searchParams.get("categories")?.split(",").filter(Boolean) ?? [];

  // Check Supabase cache (valid if expires_at > now)
  try {
    const { data: cached } = await supabase
      .from("news_reels")
      .select("id, slides")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached?.slides && Array.isArray(cached.slides) && cached.slides.length > 0) {
      const cleanSlides = (cached.slides as Record<string, string>[]).map((s) => ({
        ...s,
        title: decode(s.title ?? ""),
        description: decode(s.description ?? ""),
      }));
      return NextResponse.json({ reel_id: cached.id, slides: cleanSlides });
    }
  } catch {
    // Table may not exist yet — continue to generate fresh
  }

  // Generate fresh reel by fetching all sections in parallel
  const sections = reorderSections(userCategories);
  const results = await Promise.all(
    sections.map((s) => fetchSectionArticles(s as GuardianSection, 1))
  );
  const slides = results.flat();

  // Try to cache result in Supabase (4-hour TTL)
  try {
    if (slides.length > 0) {
      const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
      const { data: saved } = await supabase
        .from("news_reels")
        .insert({ slides, expires_at: expiresAt })
        .select("id")
        .single();
      return NextResponse.json({ reel_id: saved?.id ?? null, slides });
    }
  } catch {
    // Ignore cache write failure
  }

  return NextResponse.json({ reel_id: null, slides });
}
