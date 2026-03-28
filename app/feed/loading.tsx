import { BottomNav } from "@/components/BottomNav";

export default function FeedLoading() {
  return (
    <main className="relative mx-auto h-[100dvh] max-w-md overflow-hidden">
      <div className="h-[100dvh]">
        {/* Tab pills skeleton */}
        <div className="flex items-center justify-center pt-4 pb-2">
          <div className="flex gap-1 rounded-full border border-white/10 bg-black/40 px-1 py-1 backdrop-blur-md">
            <div className="h-7 w-16 animate-pulse rounded-full bg-white/15" />
            <div className="h-7 w-20 animate-pulse rounded-full bg-white/8" />
          </div>
        </div>

        {/* Full-screen reel skeleton */}
        <div className="relative flex h-[calc(100vh-60px)] flex-col justify-end overflow-hidden">
          <div className="absolute inset-0 animate-pulse bg-[var(--surface-1)]" />
          <div className="relative z-10 px-5 pb-28 pt-8">
            {/* Category badge */}
            <div className="mb-3">
              <div className="h-5 w-20 animate-pulse rounded-full bg-white/10" />
            </div>
            {/* Title */}
            <div className="space-y-2.5">
              <div className="h-7 w-[85%] animate-pulse rounded-lg bg-white/12" />
              <div className="h-7 w-[60%] animate-pulse rounded-lg bg-white/12" />
            </div>
            {/* Subtitle */}
            <div className="mt-3 h-4 w-[90%] animate-pulse rounded-md bg-white/6" />
            {/* Author */}
            <div className="mt-5 flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
              <div className="space-y-1.5">
                <div className="h-3 w-24 animate-pulse rounded-md bg-white/10" />
                <div className="h-2.5 w-16 animate-pulse rounded-md bg-white/6" />
              </div>
            </div>
          </div>

          {/* Action sidebar */}
          <div className="absolute bottom-28 right-5 flex flex-col gap-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="h-11 w-11 animate-pulse rounded-full bg-white/8" />
                <div className="h-2 w-6 animate-pulse rounded-sm bg-white/6" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
