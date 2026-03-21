import { BottomNav } from "@/components/BottomNav";

export default function ChallengeLoading() {
  return (
    <main className="relative min-h-screen bg-background pb-28">
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-4 py-4 backdrop-blur-xl"
        style={{ backgroundColor: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-36 animate-pulse rounded-lg bg-[var(--surface-3)]" />
            <div className="h-3 w-44 animate-pulse rounded-md bg-[var(--surface-2)]" />
          </div>
          <div className="h-8 w-14 animate-pulse rounded-xl bg-[var(--surface-3)]" />
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-5 px-4 pt-5">
        {/* 3-column stats */}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 text-center"
            >
              <div className="mx-auto mb-2 h-6 w-10 animate-pulse rounded-md bg-[var(--surface-2)]" />
              <div className="mx-auto h-2.5 w-16 animate-pulse rounded-sm bg-[var(--surface-2)]" />
            </div>
          ))}
        </div>

        {/* Today's challenge skeleton */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 space-y-3">
          <div className="h-4 w-32 animate-pulse rounded-md bg-[var(--surface-3)]" />
          <div className="h-5 w-[90%] animate-pulse rounded-md bg-[var(--surface-2)]" />
          <div className="h-5 w-[70%] animate-pulse rounded-md bg-[var(--surface-2)]" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-[var(--surface-2)]" />
        </div>

        {/* Leaderboard skeleton */}
        <div>
          <div className="mb-3 h-3 w-24 animate-pulse rounded-sm bg-[var(--surface-2)]" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2.5"
              >
                <div className="h-5 w-5 animate-pulse rounded-full bg-[var(--surface-2)]" />
                <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--surface-2)]" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-24 animate-pulse rounded-sm bg-[var(--surface-2)]" />
                  <div className="h-2.5 w-16 animate-pulse rounded-sm bg-[var(--surface-2)]" />
                </div>
                <div className="h-4 w-8 animate-pulse rounded-md bg-[var(--surface-2)]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
