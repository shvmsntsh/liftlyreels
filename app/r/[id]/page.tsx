import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { REEL_GRADIENTS } from "@/lib/types";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  if (!isSupabaseConfigured()) return {};
  const supabase = createSupabaseServerClient();
  const { data: post } = await supabase
    .from("posts")
    .select("title,content,category")
    .eq("id", params.id)
    .single();
  if (!post) return { title: "Liftly Reel" };
  return {
    title: `${post.title} — Liftly`,
    description: `${post.content?.[0] ?? ""} | Liftly — Stop Scrolling. Start Proving.`,
    openGraph: {
      title: post.title,
      description: post.content?.[0] ?? "",
      siteName: "Liftly",
    },
  };
}

export default async function PublicReelPage({ params }: { params: Params }) {
  if (!isSupabaseConfigured()) notFound();

  const supabase = createSupabaseServerClient();

  const { data: post } = await supabase
    .from("posts")
    .select("id,title,content,category,gradient,source,tags,views_count,author_id,image_url,created_at")
    .eq("id", params.id)
    .single();

  if (!post) notFound();

  // Fetch author separately
  const { data: author } = post.author_id
    ? await supabase
        .from("profiles")
        .select("username,display_name,avatar_url")
        .eq("id", post.author_id)
        .single()
    : { data: null };

  // Fetch reaction counts
  const { data: reactions } = await supabase
    .from("reactions")
    .select("reaction_type")
    .eq("post_id", params.id);

  const reactionCounts = { sparked: 0, fired_up: 0, bookmarked: 0 };
  for (const r of reactions ?? []) {
    if (r.reaction_type in reactionCounts) {
      reactionCounts[r.reaction_type as keyof typeof reactionCounts]++;
    }
  }

  // Increment view count (non-blocking)
  void supabase.rpc("increment_views", { post_id: params.id });

  const gradient = REEL_GRADIENTS[post.gradient] ?? REEL_GRADIENTS.ocean;
  const content = Array.isArray(post.content) ? post.content as string[] : [];
  const tags = Array.isArray(post.tags) ? post.tags as string[] : [];

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{
        background: `linear-gradient(160deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center">
            <svg viewBox="0 0 36 36" width="28" height="28" fill="none">
              <defs>
                <linearGradient id="lg" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <path d="M 5 20 L 13 29 L 31 5" stroke="url(#lg)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M 31 5 L 26 4 M 31 5 L 31 11" stroke="url(#lg)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <span className="text-sm font-black text-white tracking-tight">Liftly</span>
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-400 transition"
        >
          Join Free
        </Link>
      </div>

      {/* Reel content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 max-w-lg mx-auto w-full">
        {/* Category badge */}
        <div className="mb-4 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/70 backdrop-blur-sm">
          {post.category}
        </div>

        {/* Title */}
        <h1 className="mb-6 text-center text-3xl font-black leading-tight text-white">
          {post.title}
        </h1>

        {/* Content bullets */}
        {content.length > 0 && (
          <div className="mb-6 w-full space-y-3">
            {content.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-white/90">{item}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-6 flex flex-wrap justify-center gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/15 bg-white/8 px-2.5 py-0.5 text-[11px] text-white/60">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 flex items-center gap-4 text-sm text-white/50">
          <span>⚡ {reactionCounts.sparked}</span>
          <span>🔥 {reactionCounts.fired_up}</span>
          <span>🔖 {reactionCounts.bookmarked}</span>
          <span>👁 {post.views_count ?? 0}</span>
        </div>

        {/* Author */}
        {author && (
          <div className="mb-8 flex items-center gap-2 text-sm text-white/60">
            <div className="h-6 w-6 rounded-full bg-white/15 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
              {author.avatar_url ? (
                <img src={author.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                (author.display_name ?? author.username)[0]?.toUpperCase()
              )}
            </div>
            <span>{author.display_name ?? author.username}</span>
          </div>
        )}

        {/* CTA */}
        <div className="w-full space-y-3">
          <Link
            href="/signup"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-base font-black text-white shadow-[0_4px_24px_rgba(16,185,129,0.4)] transition hover:bg-emerald-400"
          >
            I Did This — Join Liftly
          </Link>
          <Link
            href="/login"
            className="block w-full py-3 text-center text-sm font-semibold text-white/50 hover:text-white/80 transition"
          >
            Already have an account? Log in
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 text-center">
        <p className="text-[11px] text-white/30">Liftly — Stop Scrolling. Start Proving.</p>
      </div>
    </main>
  );
}
