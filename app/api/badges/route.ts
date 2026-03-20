import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { SupabaseClient } from "@supabase/supabase-js";

const BADGE_CHECKS: Record<
  string,
  (userId: string, supabase: SupabaseClient) => Promise<boolean>
> = {
  first_spark: async (userId, sb) => {
    const { count } = await sb
      .from("reactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("reaction_type", "sparked");
    return (count ?? 0) >= 1;
  },
  first_reel: async (userId, sb) => {
    const { count } = await sb
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", userId);
    return (count ?? 0) >= 1;
  },
  impact_logger: async (userId, sb) => {
    const { count } = await sb
      .from("impact_journal")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    return (count ?? 0) >= 1;
  },
  wisdomkeeper: async (userId, sb) => {
    const { count } = await sb
      .from("reactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("reaction_type", "bookmarked");
    return (count ?? 0) >= 10;
  },
  challenge_5: async (userId, sb) => {
    const { count } = await sb
      .from("challenge_completions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    return (count ?? 0) >= 5;
  },
  vibe_100: async (userId, sb) => {
    const { data } = await sb
      .from("profiles")
      .select("vibe_score")
      .eq("id", userId)
      .single();
    return (data?.vibe_score ?? 0) >= 100;
  },
  vibe_500: async (userId, sb) => {
    const { data } = await sb
      .from("profiles")
      .select("vibe_score")
      .eq("id", userId)
      .single();
    return (data?.vibe_score ?? 0) >= 500;
  },
};

export async function POST() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const newBadges: string[] = [];

  // Get already-earned badges
  const { data: existing } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", user.id);

  const earnedSet = new Set((existing ?? []).map((b) => b.badge_id));

  // Check streak badges
  const { data: profile } = await supabase
    .from("profiles")
    .select("streak_current,streak_longest")
    .eq("id", user.id)
    .single();

  const streak = Math.max(
    profile?.streak_current ?? 0,
    profile?.streak_longest ?? 0
  );

  const streakBadges: Array<[string, number]> = [
    ["streak_3", 3],
    ["streak_7", 7],
    ["streak_14", 14],
    ["streak_30", 30],
  ];

  for (const [badgeId, threshold] of streakBadges) {
    if (streak >= threshold && !earnedSet.has(badgeId)) {
      await supabase.from("user_badges").insert({ user_id: user.id, badge_id: badgeId });
      newBadges.push(badgeId);
      earnedSet.add(badgeId);
    }
  }

  // Check other badges
  for (const [badgeId, checkFn] of Object.entries(BADGE_CHECKS)) {
    if (earnedSet.has(badgeId)) continue;
    const earned = await checkFn(user.id, supabase);
    if (earned) {
      await supabase.from("user_badges").insert({ user_id: user.id, badge_id: badgeId });
      newBadges.push(badgeId);
    }
  }

  return NextResponse.json({ newBadges });
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("user_badges")
    .select("badge_id,earned_at,badges(id,name,description,emoji,rarity)")
    .eq("user_id", user.id)
    .order("earned_at", { ascending: false });

  return NextResponse.json({ badges: data ?? [] });
}
