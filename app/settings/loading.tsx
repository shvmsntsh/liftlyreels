import { BottomNav } from "@/components/BottomNav";

export default function SettingsLoading() {
  return (
    <main className="relative min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-xl">
        <div className="mx-auto max-w-md px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--surface-2)]" />
            <div className="h-5 w-20 animate-pulse rounded-lg bg-[var(--surface-2)]" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-2 px-4 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4"
          >
            <div className="h-9 w-9 animate-pulse rounded-xl bg-[var(--surface-2)]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-16 animate-pulse rounded-md bg-[var(--surface-2)]" />
              <div className="h-2.5 w-32 animate-pulse rounded-sm bg-[var(--surface-2)]" />
            </div>
            <div className="h-4 w-4 animate-pulse rounded bg-[var(--surface-2)]" />
          </div>
        ))}

        {/* Form skeleton */}
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 space-y-4">
          <div className="h-4 w-24 animate-pulse rounded-md bg-[var(--surface-2)]" />
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="h-3 w-20 animate-pulse rounded-sm bg-[var(--surface-2)]" />
              <div className="h-10 w-full animate-pulse rounded-xl bg-[var(--surface-2)]" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-8 animate-pulse rounded-sm bg-[var(--surface-2)]" />
              <div className="h-20 w-full animate-pulse rounded-xl bg-[var(--surface-2)]" />
            </div>
          </div>
          <div className="h-11 w-full animate-pulse rounded-xl bg-[var(--surface-2)]" />
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
