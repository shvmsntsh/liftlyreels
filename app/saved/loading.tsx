import { BottomNav } from "@/components/BottomNav";

export default function SavedLoading() {
  return (
    <main className="relative mx-auto h-[100dvh] max-w-md overflow-hidden">
      {/* Full-screen reel skeleton */}
      <div className="relative flex h-[100dvh] flex-col justify-end overflow-hidden">
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

      <BottomNav />
    </main>
  );
}
