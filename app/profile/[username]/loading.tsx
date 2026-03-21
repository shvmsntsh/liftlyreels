import { BottomNav } from "@/components/BottomNav";

export default function ProfileLoading() {
  return (
    <main className="relative min-h-screen bg-background pb-28">
      {/* Header gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(56,189,248,0.12),transparent)]" />

      <div className="relative mx-auto max-w-md px-4 pt-10">
        {/* Top actions */}
        <div className="flex justify-end gap-2 mb-4">
          <div className="h-8 w-20 animate-pulse rounded-lg bg-[var(--surface-2)]" />
          <div className="h-8 w-20 animate-pulse rounded-lg bg-[var(--surface-2)]" />
        </div>

        {/* Avatar + name */}
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-[var(--surface-2)]" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-32 animate-pulse rounded-lg bg-[var(--surface-2)]" />
            <div className="h-3.5 w-20 animate-pulse rounded-md bg-[var(--surface-2)]" />
            <div className="h-3.5 w-48 animate-pulse rounded-md bg-[var(--surface-2)]" />
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-2 text-center"
            >
              <div className="mx-auto mb-1 h-5 w-8 animate-pulse rounded-md bg-[var(--surface-2)]" />
              <div className="mx-auto h-2.5 w-12 animate-pulse rounded-sm bg-[var(--surface-2)]" />
            </div>
          ))}
        </div>

        {/* Streak */}
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-orange-400/15 bg-orange-950/20 px-4 py-2.5">
          <div className="h-4 w-4 animate-pulse rounded bg-orange-400/30" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-24 animate-pulse rounded-md bg-[var(--surface-2)]" />
            <div className="h-3 w-20 animate-pulse rounded-sm bg-[var(--surface-2)]" />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex border-b border-[var(--border)]">
          {["w-14", "w-14", "w-14", "w-12"].map((w, i) => (
            <div key={i} className="flex-1 flex justify-center pb-2">
              <div className={`h-3.5 ${w} animate-pulse rounded-sm bg-[var(--surface-2)]`} />
            </div>
          ))}
        </div>

        {/* Reels grid skeleton */}
        <div className="mt-4 grid grid-cols-2 gap-3 pb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl bg-[var(--surface-1)]"
              style={{ aspectRatio: "3/4" }}
            >
              <div className="flex h-full flex-col justify-end p-3">
                <div className="h-2.5 w-12 rounded-sm bg-[var(--surface-3)]" />
                <div className="mt-1.5 h-3 w-full rounded-sm bg-[var(--surface-3)]" />
                <div className="mt-1 h-3 w-3/4 rounded-sm bg-[var(--surface-3)]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
