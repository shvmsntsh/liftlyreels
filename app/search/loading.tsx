import { BottomNav } from "@/components/BottomNav";

export default function SearchLoading() {
  return (
    <main className="relative min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-xl">
        <div className="mx-auto max-w-md px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--surface-2)]" />
            <div className="h-10 flex-1 animate-pulse rounded-xl bg-[var(--surface-2)]" />
          </div>
          {/* Tab pills */}
          <div className="mt-3 flex gap-1">
            {["w-12", "w-14", "w-14"].map((w, i) => (
              <div key={i} className={`h-7 ${w} animate-pulse rounded-full bg-[var(--surface-2)]`} />
            ))}
          </div>
        </div>
      </div>

      {/* Empty state skeleton */}
      <div className="mx-auto max-w-md px-4 pt-16 text-center">
        <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
        <div className="mx-auto h-4 w-28 animate-pulse rounded-md bg-[var(--surface-2)]" />
        <div className="mx-auto mt-2 h-3 w-48 animate-pulse rounded-md bg-[var(--surface-2)]" />
      </div>

      <BottomNav />
    </main>
  );
}
