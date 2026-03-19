"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, MessageCircle, Share2, Zap, Flame } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { PostRecord, ReactionType, REEL_GRADIENTS } from "@/lib/types";
import { UserAvatar } from "./UserAvatar";
import { CommentsSheet } from "./CommentsSheet";
import { ImpactModal } from "./ImpactModal";

type ReactionButtonProps = {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
  children: React.ReactNode;
  activeClass: string;
};

function ReactionButton({ active, label, count, onClick, children, activeClass }: ReactionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={clsx(
        "flex h-14 w-14 flex-col items-center justify-center rounded-full border text-[11px] transition-all active:scale-90",
        active ? activeClass : "border-white/15 bg-slate-950/45 text-white hover:bg-slate-900/70"
      )}
    >
      {children}
      <span className="mt-0.5">{count > 0 ? count : label.split(" ")[0]}</span>
    </button>
  );
}

type Props = {
  post: PostRecord;
  userId?: string;
};

export function ReelCard({ post, userId }: Props) {
  const [reactions, setReactions] = useState<{ sparked: number; fired_up: number; bookmarked: number }>({
    sparked: post.reactions_summary?.sparked ?? 0,
    fired_up: post.reactions_summary?.fired_up ?? 0,
    bookmarked: post.reactions_summary?.bookmarked ?? 0,
  });
  const [myReactions, setMyReactions] = useState<Set<ReactionType>>(
    new Set((post.user_reactions ?? []) as ReactionType[])
  );
  const [commentsCount, setCommentsCount] = useState(post.comments_count ?? 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [impactOpen, setImpactOpen] = useState(false);
  const [impactLogged, setImpactLogged] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share");

  // Determine background style
  const gradient = REEL_GRADIENTS[post.gradient ?? "ocean"] ?? REEL_GRADIENTS.ocean;

  const toggleReaction = useCallback(
    async (type: ReactionType) => {
      if (!userId) return;

      const hadIt = myReactions.has(type);

      // Optimistic update
      setMyReactions((prev) => {
        const next = new Set(prev);
        if (hadIt) { next.delete(type); } else { next.add(type); }
        return next;
      });
      setReactions((prev) => ({
        ...prev,
        [type]: Math.max(0, prev[type] + (hadIt ? -1 : 1)),
      }));

      await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, reactionType: type }),
      });
    },
    [post.id, userId, myReactions]
  );

  async function handleShare() {
    const url =
      typeof window === "undefined"
        ? ""
        : `${window.location.origin}/feed#${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.content[0], url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setShareLabel("Copied!");
    } catch {
      setShareLabel("Retry");
    }
    setTimeout(() => setShareLabel("Share"), 2000);
  }

  return (
    <>
      <motion.article
        id={post.id}
        initial={{ opacity: 0.7, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="snap-start relative flex min-h-screen items-end overflow-hidden px-4 pb-28 pt-8 sm:px-6"
      >
        {/* Background */}
        {post.image_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${post.image_url})` }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
            }}
          />
        )}

        {/* Overlays */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.12)_0%,rgba(2,6,23,0.6)_40%,rgba(2,6,23,0.95)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_72%)]" />

        <div className="relative z-10 mx-auto flex w-full max-w-md items-end gap-3">
          {/* Main content card */}
          <div className="flex-1 rounded-[2rem] border border-white/10 bg-slate-950/50 p-5 shadow-2xl shadow-black/40 backdrop-blur-md">
            {/* Category + source row */}
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
                {post.category}
              </span>
              {post.is_user_created && (
                <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-violet-300">
                  Community
                </span>
              )}
              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                {post.source}
              </span>
            </div>

            <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
              {post.title}
            </h2>

            <ul className="mt-4 space-y-2.5">
              {post.content.slice(0, 5).map((item, i) => (
                <li key={i} className="flex gap-3 text-sm leading-6 text-slate-100">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* Author row */}
            {post.author && (
              <Link
                href={`/profile/${post.author.username}`}
                className="mt-4 flex items-center gap-2 group"
              >
                <UserAvatar
                  username={post.author.username}
                  avatarUrl={post.author.avatar_url}
                  size="sm"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-300 group-hover:text-white transition">
                    {post.author.display_name ?? post.author.username}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    ⚡ {post.author.vibe_score ?? 0} vibe
                  </p>
                </div>
              </Link>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {post.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons column */}
          <div className="mb-2 flex flex-col gap-2.5">
            <ReactionButton
              active={myReactions.has("sparked")}
              label="Spark"
              count={reactions.sparked}
              onClick={() => toggleReaction("sparked")}
              activeClass="border-amber-300/60 bg-amber-400/15 text-amber-200"
            >
              <Zap className={clsx("h-5 w-5", myReactions.has("sparked") && "fill-current")} />
            </ReactionButton>

            <ReactionButton
              active={myReactions.has("fired_up")}
              label="Fire"
              count={reactions.fired_up}
              onClick={() => toggleReaction("fired_up")}
              activeClass="border-orange-300/60 bg-orange-400/15 text-orange-200"
            >
              <Flame className={clsx("h-5 w-5", myReactions.has("fired_up") && "fill-current")} />
            </ReactionButton>

            <ReactionButton
              active={myReactions.has("bookmarked")}
              label="Save"
              count={reactions.bookmarked}
              onClick={() => toggleReaction("bookmarked")}
              activeClass="border-sky-300/60 bg-sky-400/15 text-sky-200"
            >
              <Bookmark className={clsx("h-5 w-5", myReactions.has("bookmarked") && "fill-current")} />
            </ReactionButton>

            <ReactionButton
              active={false}
              label="Talk"
              count={commentsCount}
              onClick={() => setCommentsOpen(true)}
              activeClass=""
            >
              <MessageCircle className="h-5 w-5" />
            </ReactionButton>

            <button
              onClick={handleShare}
              className="flex h-14 w-14 flex-col items-center justify-center rounded-full border border-white/15 bg-slate-950/45 text-[11px] text-white transition hover:bg-slate-900/70 active:scale-90"
            >
              <Share2 className="h-5 w-5" />
              <span className="mt-0.5">{shareLabel}</span>
            </button>

            {/* Impact journal button */}
            <button
              onClick={() => setImpactOpen(true)}
              title="Log impact"
              className={clsx(
                "flex h-14 w-14 flex-col items-center justify-center rounded-full border text-[10px] transition active:scale-90",
                impactLogged
                  ? "border-amber-300/60 bg-amber-400/15 text-amber-200"
                  : "border-white/15 bg-slate-950/45 text-white hover:bg-slate-900/70"
              )}
            >
              <span className="text-lg">{impactLogged ? "✅" : "📓"}</span>
              <span className="mt-0.5">Impact</span>
            </button>
          </div>
        </div>
      </motion.article>

      <CommentsSheet
        postId={post.id}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        commentsCount={commentsCount}
        onCountChange={setCommentsCount}
      />

      <ImpactModal
        postId={post.id}
        postTitle={post.title}
        isOpen={impactOpen}
        onClose={() => setImpactOpen(false)}
        onLogged={() => {
          setImpactLogged(true);
          setImpactOpen(false);
        }}
      />
    </>
  );
}
