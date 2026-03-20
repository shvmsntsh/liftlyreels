import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { BottomNav } from "@/components/BottomNav";
import { DailyChallengeBar } from "@/components/DailyChallengeBar";
import { DailyChallenge } from "@/lib/types";
import { Flame, Trophy, Calendar, Crown, CheckCircle2, Circle } from "lucide-react";

export const dynamic = "force-dynamic";

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

  const challenges = await getRecentChallenges(userId);
  const today = challenges.find(
    (c) => c.date === new Date().toISOString().split("T")[0]
  );
  const past = challenges.filter(
    (c) => c.date !== new Date().toISOString().split("T")[0]
  );

  const completedCount = challenges.filter((c) => c.user_completed).length;
  const streak = challenges.reduce((acc, c, i) => {
    if (i === 0 && !c.user_completed) return 0;
    if (c.user_completed) return acc + 1;
    return acc;
  }, 0);

  // Get top completers
  let topUsers: Array<{ username: string; display_name: string | null; count: number }> = [];
  if (isSupabaseConfigured() && today) {
    const { data: recentCompletions } = await supabase
      .from("challenge_completions")
      .select("user_id")
      .in(
        "challenge_id",
        challenges.map((c) => c.id)
      );

    const countMap: Record<string, number> = {};
    for (const c of recentCompletions ?? []) {
      countMap[c.user_id] = (countMap[c.user_id] ?? 0) + 1;
    }

    const topIds = Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ id, count }));

    if (topIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,username,display_name")
        .in(
          "id",
          topIds.map((t) => t.id)
        );

      topUsers = topIds
        .map((t) => {
          const p = profiles?.find((p) => p.id === t.id);
          return p
            ? { username: p.username, display_name: p.display_name, count: t.count }
            : null;
        })
        .filter(Boolean) as typeof topUsers;
    }
  }

  return (
    <main className="relative min-h-screen bg-background pb-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_0%,rgba(234,88,12,0.1),transparent)]" />

      <div
        className="sticky top-0 z-20 px-4 py-4 backdrop-blur-xl"
        style={{
          backgroundColor: "var(--surface-2)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Daily Challenges</h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Take action, not just notes</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-orange-400/20 bg-orange-400/10 px-3 py-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-400 fill-current" />
            <span className="text-sm font-bold text-orange-300">{streak}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-5 px-4 pt-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Flame, label: "Streak", value: streak, color: "text-orange-300" },
            { icon: Trophy, label: "Completed", value: completedCount, color: "text-amber-300" },
            { icon: Calendar, label: "This Week", value: challenges.length, color: "text-sky-300" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl p-3 text-center"
              style={{
                backgroundColor: "var(--surface-1)",
                border: "1px solid var(--border)",
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

        {/* Leaderboard */}
        {topUsers.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{
              backgroundColor: "var(--surface-1)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              Challenge Champions (7 days)
            </p>
            {topUsers.map((u, i) => (
              <div key={u.username} className="flex items-center gap-3 py-2">
                <span className="w-5 text-sm font-bold text-slate-500">{i + 1}</span>
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: "var(--surface-3)" }}
                >
                  {u.username[0]?.toUpperCase()}
                </div>
                <span className="flex-1 text-sm text-slate-200">
                  {u.display_name ?? u.username}
                </span>
                <span className="text-xs font-bold text-orange-300">{u.count} done</span>
              </div>
            ))}
          </div>
        )}

        {/* Past challenges */}
        {past.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Past Challenges
            </p>
            <div className="space-y-2">
              {past.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-xl px-4 py-3 ${
                    c.user_completed
                      ? "border border-emerald-400/20 bg-emerald-950/30"
                      : ""
                  }`}
                  style={
                    c.user_completed
                      ? undefined
                      : {
                          backgroundColor: "var(--surface-1)",
                          border: "1px solid var(--border)",
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
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-600" />
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
