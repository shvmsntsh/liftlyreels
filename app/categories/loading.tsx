import { BottomNav } from "@/components/BottomNav";

export default function CategoriesLoading() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-8">
      {/* Header */}
      <div className="relative mb-6 space-y-2">
        <div className="h-3 w-16 animate-pulse rounded-sm bg-[var(--surface-2)]" />
        <div className="h-8 w-40 animate-pulse rounded-lg bg-[var(--surface-2)]" />
        <div className="h-3.5 w-56 animate-pulse rounded-md bg-[var(--surface-2)]" />
      </div>

      {/* Category cards */}
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-[var(--surface-2)]" />
              <div className="space-y-1.5">
                <div className="h-4 w-20 animate-pulse rounded-md bg-[var(--surface-2)]" />
                <div className="h-2.5 w-14 animate-pulse rounded-sm bg-[var(--surface-2)]" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-8 animate-pulse rounded-full bg-[var(--surface-2)]" />
              <div className="h-4 w-4 animate-pulse rounded bg-[var(--surface-2)]" />
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
