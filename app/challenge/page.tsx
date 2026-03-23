import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { BottomNav } from "@/components/BottomNav";
import { DailyChallengeBar } from "@/components/DailyChallengeBar";
import { HowToPlayCard } from "@/components/HowToPlayCard";
import { DailyChallenge, getBadge, getNextBadge, getStreakRank, getNextStreakRank } from "@/lib/types";
import { Flame, Trophy, Calendar, Crown, Target, Award, Sparkles, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

async function ensureTodayChallenge() {
  if (!isSupabaseConfigured()) return null;
  const supabase = createSupabaseServerClient();
  const today = new Date().toISOString().split("T")[0];

  // Check if today's challenge already exists
  const { data: existing } = await supabase
    .from("daily_challenges")
    .select("*")
    .eq("date", today)
    .single();

  if (existing) return existing;

  // Auto-pick from pool
  const { data: pool } = await supabase
    .from("challenge_pool")
    .select("challenge_text, category")
    .limit(100);

  if (!pool?.length) return null;

  // Pick a random challenge
  const pick = pool[Math.floor(Math.random() * pool.length)];

  const { data: created } = await supabase
    .from("daily_challenges")
    .insert({
      date: today,
      challenge_text: pick.challenge_text,
      completions_count: 0,
    })
    .select("*")
    .single();

  return created;
}

async function getRecentChallenges(userId: string) {
  if (!isSupabaseConfigured()) return [];

  const supabase = createSupabaseServerClient();

  const { data: challenges } = await supabase
    .from("daily_challenges")
    .select("*")
    .order("date", { ascending: false })
    .limit(7);

  if (!challenges?.length) return [];

  const { data: completions } = await supabase
    .from("challenge_completions")
    .select("challenge_id,note")
    .eq("user_id", userId)
    .in(
      "challenge_id",
      challenges.map((c) => c.id)
    );

  const completedIds = new Set(completions?.map((c) => c.challenge_id) ?? []);
  const notesMap: Record<string, string> = {};
  for (const c of completions ?? []) {
    if (c.note) notesMap[c.challenge_id] = c.note;
  }

  return challenges.map((c) => ({
    ...(c as DailyChallenge),
    user_completed: completedIds.has(c.id),
    user_note: notesMap[c.id],
  }));
}

async function getUserTotalCompletions(userId: string): Promise<number> {
  if (!isSupabaseConfigured() || !userId) return 0;
  const supabase = createSupabaseServerClient();
  const { count } = await supabase
    .from("challenge_completions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

function dateLabel(dateStr: string) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default async function ChallengePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  // Ensure today's challenge exists (auto-pick from pool)
  await ensureTodayChallenge();

  const [challenges, totalCompletions] = await Promise.all([
    getRecentChallenges(userId),
    getUserTotalCompletions(userId),
  ]);

  const today = challenges.find(
    (c) => c.date === new Date().toISOString().split("T")[0]
  );
  const past = challenges.filter(
    (c) => c.date !== new Date().toISOString().split("T")[0]
  );

  const completedThisWeek = challenges.filter((c) => c.user_completed).length;
  const streak = challenges.reduce((acc, c, i) => {
    if (i === 0 && !c.user_completed) return 0;
    if (c.user_completed) return acc + 1;
    return acc;
  }, 0);

  const badge = getBadge(totalCompletions);
  const nextBadge = getNextBadge(totalCompletions);
  const streakRank = getStreakRank(streak);
  const nextStreakRank = getNextStreakRank(streak);

  // Get top 10 completers with total completions for badges
  let topUsers: Array<{ username: string; display_name: string | null; avatar_url: string | null; count: number; totalCompletions: number }> = [];
  let weeklyWinners: Array<{ username: string; display_name: string | null; avatar_url: string | null; count: number }> = [];

  if (isSupabaseConfigured()) {
    // All-time leaderboard: top 10 by total completions
    const { data: allCompletions } = await supabase
      .from("challenge_completions")
      .select("user_id");

    if (allCompletions?.length) {
      const countMap: Record<string, number> = {};
      for (const c of allCompletions) {
        countMap[c.user_id] = (countMap[c.user_id] ?? 0) + 1;
      }

      const topIds = Object.entries(countMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id, count]) => ({ id, count }));

      if (topIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,username,display_name,avatar_url")
          .in("id", topIds.map((t) => t.id));

        topUsers = topIds
          .map((t) => {
            const p = profiles?.find((p) => p.id === t.id);
            return p
              ? { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url, count: t.count, totalCompletions: t.count }
              : null;
          })
          .filter(Boolean) as typeof topUsers;
      }

      // Weekly winners: top 3 this week
      if (challenges.length > 0) {
        const challengeIds = challenges.map((c) => c.id);
        const { data: weeklyCompletions } = await supabase
          .from("challenge_completions")
          .select("user_id")
          .in("challenge_id", challengeIds);

        if (weeklyCompletions?.length) {
          const weekMap: Record<string, number> = {};
          for (const c of weeklyCompletions) {
            weekMap[c.user_id] = (weekMap[c.user_id] ?? 0) + 1;
          }
          const weekTopIds = Object.entries(weekMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([id, count]) => ({ id, count }));

          if (weekTopIds.length > 0) {
            const { data: weekProfiles } = await supabase
              .from("profiles")
              .select("id,username,display_name,avatar_url")
              .in("id", weekTopIds.map((t) => t.id));

            weeklyWinners = weekTopIds
              .map((t) => {
                const p = weekProfiles?.find((p) => p.id === t.id);
                return p
                  ? { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url, count: t.count }
                  : null;
              })
              .filter(Boolean) as typeof weeklyWinners;
          }
        }
      }
    }
  }

  const podiumColors = ["text-amber-400", "text-slate-300", "text-orange-400"];
  const podiumLabels = ["1st", "2nd", "3rd"];

  return (
    <main className="relative min-h-screen bg-background pb-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_0%,rgba(234,88,12,0.12),transparent)]" />

      {/* Header with gradient accent */}
      <div
        className="sticky top-0 z-20 px-4 py-4 backdrop-blur-xl"
        style={{
          backgroundColor: "var(--surface-2)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-400" />
              Daily Challenges
            </h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Take action, not just notes</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-orange-400/20 bg-orange-400/10 px-3 py-1.5">
              <span className="text-sm">{streakRank.icon}</span>
              <span className="text-sm font-bold text-orange-300">{streak}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-5 px-4 pt-5">
        {/* How to Play card (dismissible) */}
        <HowToPlayCard />

        {/* Badge + Rank Progress */}
        <div
          className="rounded-2xl p-4 backdrop-blur-sm"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{badge.icon}</span>
              <div>
                <p className="text-sm font-bold text-white">{badge.name} Badge</p>
                <p className="text-[11px] text-slate-500">{totalCompletions} total completions</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1">
              <span className="text-sm">{streakRank.icon}</span>
              <span className="text-xs font-semibold" style={{ color: streakRank.color }}>{streakRank.name}</span>
            </div>
          </div>
          {nextBadge && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-slate-500">Next: {nextBadge.icon} {nextBadge.name}</p>
                <p className="text-[11px] text-slate-500">{totalCompletions}/{nextBadge.min}</p>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((totalCompletions / nextBadge.min) * 100, 100)}%`,
                    backgroundColor: nextBadge.color,
                  }}
                />
              </div>
            </div>
          )}
          {nextStreakRank && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-slate-500">Streak rank: {nextStreakRank.icon} {nextStreakRank.name} at {nextStreakRank.min} days</p>
                <p className="text-[11px] text-slate-500">{streak}/{nextStreakRank.min}</p>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((streak / nextStreakRank.min) * 100, 100)}%`,
                    backgroundColor: nextStreakRank.color,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Flame, label: "Streak", value: streak, color: "text-orange-300" },
            { icon: Trophy, label: "This Week", value: completedThisWeek, color: "text-amber-300" },
            { icon: Award, label: "All Time", value: totalCompletions, color: "text-sky-300" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl p-3 text-center backdrop-blur-sm"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Icon className={`mx-auto mb-1 h-4 w-4 ${color}`} />
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-[10px]" style={{ color: "var(--muted)" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Today's challenge */}
        {today ? (
          <DailyChallengeBar challenge={today} fullPage />
        ) : (
          <div
            className="rounded-2xl p-5 text-center text-sm"
            style={{
              backgroundColor: "var(--surface-1)",
              border: "1px solid var(--border)",
              color: "var(--muted)",
            }}
          >
            No challenge set for today yet. Check back soon!
          </div>
        )}

        {/* Weekly Winners */}
        {weeklyWinners.length > 0 && (
          <div
            className="rounded-2xl p-4 backdrop-blur-sm"
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              Weekly Winners
            </p>
            <div className="flex justify-center gap-4">
              {weeklyWinners.map((u, i) => (
                <div key={u.username} className="text-center">
                  <div className={`text-lg font-bold ${podiumColors[i]}`}>{podiumLabels[i]}</div>
                  <div
                    className="mx-auto mt-1 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: "var(--surface-3)" }}
                  >
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      u.username[0]?.toUpperCase()
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-300 truncate max-w-[80px]">
                    {u.display_name ?? u.username}
                  </p>
                  <p className="text-[10px] text-orange-300 font-bold">{u.count} done</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard — Top 10 */}
        {topUsers.length > 0 && (
          <div
            className="rounded-2xl p-4 backdrop-blur-sm"
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              All-Time Leaderboard
            </p>
            {topUsers.map((u, i) => {
              const userBadge = getBadge(u.totalCompletions);
              return (
                <div key={u.username} className="flex items-center gap-3 py-2">
                  <span className="w-5 text-sm font-bold text-slate-500">{i + 1}</span>
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden"
                    style={{ backgroundColor: "var(--surface-3)" }}
                  >
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      u.username[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-slate-200 truncate block">
                      {u.display_name ?? u.username}
                    </span>
                  </div>
                  <span className="text-sm" title={userBadge.name}>{userBadge.icon}</span>
                  <span className="text-xs font-bold text-orange-300 tabular-nums">{u.count}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Past challenges */}
        {past.length > 0 && (
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              <TrendingUp className="h-3.5 w-3.5" />
              Past Challenges
            </p>
            <div className="space-y-2">
              {past.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-xl px-4 py-3 backdrop-blur-sm ${
                    c.user_completed
                      ? "border border-emerald-400/20 bg-emerald-950/30"
                      : ""
                  }`}
                  style={
                    c.user_completed
                      ? undefined
                      : {
                          backgroundColor: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-[11px]" style={{ color: "var(--muted)" }}>{dateLabel(c.date)}</p>
                      <p className="mt-0.5 text-sm text-slate-200 line-clamp-2">
                        {c.challenge_text}
                      </p>
                      {c.user_note && (
                        <p className="mt-1 text-xs text-slate-400 italic">
                          &ldquo;{c.user_note}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {c.user_completed ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20">
                          <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-slate-700" />
                      )}
                    </div>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-600">
                    {c.completions_count} completions
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav streak={streak} />
    </main>
  );
}
