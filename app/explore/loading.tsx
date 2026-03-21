import { BottomNav } from "@/components/BottomNav";

export default function ExploreLoading() {
  return (
    <main className="relative mx-auto h-screen max-w-md overflow-hidden">
      {/* Header overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/70 via-black/40 to-transparent pb-8 pt-4">
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-5 w-20 animate-pulse rounded-lg bg-white/15" />
              <div className="h-3 w-32 animate-pulse rounded-md bg-white/8" />
            </div>
            <div className="h-9 w-9 animate-pulse rounded-full bg-white/8" />
          </div>
        </div>
        {/* Category pills */}
        <div className="flex gap-2 px-4 py-2">
          {["w-12", "w-16", "w-12", "w-14", "w-16", "w-14"].map((w, i) => (
            <div
              key={i}
              className={`h-7 ${w} shrink-0 animate-pulse rounded-full bg-white/8`}
            />
          ))}
        </div>
      </div>

      {/* Full-screen reel skeleton */}
      <div className="h-screen">
        <div className="relative flex h-screen flex-col justify-end overflow-hidden">
          <div className="absolute inset-0 animate-pulse bg-[var(--surface-1)]" />
          <div className="relative z-10 px-5 pb-28">
            <div className="mb-3 h-5 w-20 animate-pulse rounded-full bg-white/10" />
            <div className="space-y-2.5">
              <div className="h-7 w-[80%] animate-pulse rounded-lg bg-white/12" />
              <div className="h-7 w-[55%] animate-pulse rounded-lg bg-white/12" />
            </div>
            <div className="mt-3 h-4 w-[85%] animate-pulse rounded-md bg-white/6" />
            <div className="mt-5 flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
              <div className="space-y-1.5">
                <div className="h-3 w-20 animate-pulse rounded-md bg-white/10" />
                <div className="h-2.5 w-14 animate-pulse rounded-md bg-white/6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
