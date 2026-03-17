import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { SectionHeader } from "@/components/SectionHeader";
import { getPosts } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const posts = await getPosts();
  const categories = Object.entries(
    posts.reduce<Record<string, number>>((acc, post) => {
      acc[post.category] = (acc[post.category] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <main className="safe-bottom mx-auto min-h-screen max-w-md px-4 pb-8 sm:px-6">
      <SectionHeader
        eyebrow="Explore"
        title="Categories"
        description="Jump into focused lessons across books, mindset, training, and nutrition."
      />

      <div className="mt-6 grid gap-4">
        {categories.map(([name, count]) => (
          <Link
            key={name}
            href="/feed"
            className="rounded-[1.75rem] border border-white/10 bg-slate-900/60 p-5 shadow-lg shadow-black/20 transition hover:border-sky-300/30 hover:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">{name}</p>
                <p className="mt-1 text-sm text-slate-400">
                  Quick ideas you can apply today
                </p>
              </div>
              <span className="rounded-full bg-sky-400/15 px-3 py-1 text-sm font-semibold text-sky-200">
                {count}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
