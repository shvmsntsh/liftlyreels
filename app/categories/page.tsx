import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { getPosts } from "@/lib/api";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const CATEGORY_META: Record<string, { emoji: string; tagline: string; gradient: string }> = {
  Mindset: { emoji: "🧠", tagline: "Mental clarity & focus practices", gradient: "from-violet-900/40 to-violet-950/20" },
  Gym: { emoji: "💪", tagline: "Training systems that compound", gradient: "from-orange-900/40 to-orange-950/20" },
  Diet: { emoji: "🥗", tagline: "Nutrition defaults that make it easy", gradient: "from-emerald-900/40 to-emerald-950/20" },
  Books: { emoji: "📚", tagline: "Life-changing ideas made actionable", gradient: "from-sky-900/40 to-sky-950/20" },
  Wellness: { emoji: "🌿", tagline: "Sleep, recovery & life balance", gradient: "from-teal-900/40 to-teal-950/20" },
  Finance: { emoji: "💰", tagline: "Smart money habits & mindset", gradient: "from-amber-900/40 to-amber-950/20" },
  Relationships: { emoji: "❤️", tagline: "Deeper connections & communication", gradient: "from-rose-900/40 to-rose-950/20" },
};

export default async function CategoriesPage() {
  const posts = await getPosts(100);
  const categories = Object.entries(
    posts.reduce<Record<string, number>>((acc, post) => {
      acc[post.category] = (acc[post.category] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_60%_30%_at_50%_0%,rgba(56,189,248,0.1),transparent)]" />

      <div className="relative mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">Browse</p>
        <h1 className="mt-1 text-3xl font-black text-foreground">Categories</h1>
        <p className="mt-1 text-sm text-slate-400">
          Focused knowledge drops for every part of your life
        </p>
      </div>

      <div className="space-y-3">
        {categories.map(([name, count]) => {
          const meta = CATEGORY_META[name] ?? {
            emoji: "✨",
            tagline: "Insights and ideas",
            gradient: "from-slate-900/40 to-slate-950/20",
          };
          return (
            <Link
              key={name}
              href={`/explore?category=${name}`}
              className={`flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r ${meta.gradient} p-4 transition hover:border-sky-300/30`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{meta.emoji}</span>
                <div>
                  <p className="font-bold text-foreground">{name}</p>
                  <p className="text-xs text-slate-400">{meta.tagline}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-xs font-bold text-sky-300">
                  {count}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </div>
            </Link>
          );
        })}
      </div>

      <BottomNav />
    </main>
  );
}
