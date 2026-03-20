"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, MessageCircle, Share2, Zap, Flame, NotebookPen } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { PostRecord, ReactionType, REEL_GRADIENTS } from "@/lib/types";
import { UserAvatar } from "./UserAvatar";
import { CommentsSheet } from "./CommentsSheet";
import { useAudio } from "./AudioProvider";
import { ImpactModal } from "./ImpactModal";

type ActionButtonProps = {
  icon: React.ReactNode;
  label: string | number;
  onClick?: () => void;
  active?: boolean;
  activeClass?: string;
  glow?: string;
};

function ActionButton({ icon, label, onClick, active, activeClass, glow }: ActionButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setPressed(true);
        setTimeout(() => setPressed(false), 200);
        onClick?.();
      }}
      className={clsx(
        "flex flex-col items-center gap-1.5 tap-highlight",
        active ? activeClass : "text-white"
      )}
    >
      <motion.div
        animate={{ scale: pressed ? 0.82 : 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 20 }}
        className={clsx(
          "flex h-11 w-11 items-center justify-center rounded-full border",
          active
            ? clsx(activeClass, "shadow-lg", glow)
            : "border-white/15 bg-white/8 backdrop-blur-sm"
        )}
      >
        {icon}
      </motion.div>
      <span className="text-[10px] font-semibold leading-none drop-shadow-sm">
        {label}
      </span>
    </button>
  );
}

type Props = {
  post: PostRecord;
  userId?: string;
};

export function ReelCard({ post, userId }: Props) {
  const cardRef = useRef<HTMLElement>(null);
  const { play } = useAudio();

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          play(post.category);
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [play, post.category]);

  const [reactions, setReactions] = useState({
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

  const gradient = REEL_GRADIENTS[post.gradient ?? "ocean"] ?? REEL_GRADIENTS.ocean;

  const toggleReaction = useCallback(
    async (type: ReactionType) => {
      if (!userId) return;
      const hadIt = myReactions.has(type);
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
      <article
        ref={cardRef}
        id={post.id}
        className="snap-start relative flex h-screen flex-col justify-end overflow-hidden"
      >
        {/* Background */}
        {post.image_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{ backgroundImage: `url(${post.image_url})` }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(160deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
            }}
          />
        )}

        {/* Gradient vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/10" />
        {/* Top glow */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent" />

        {/* Bottom content */}
        <div className="relative z-10 flex items-end gap-3 px-4 pb-28 pt-8">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Category badge */}
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
                {post.category}
              </span>
              {post.is_user_created && (
                <span className="rounded-full border border-violet-300/30 bg-violet-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                  Community
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-[1.6rem] font-black leading-[1.15] tracking-tight text-white drop-shadow-lg">
              {post.title}
            </h2>

            {/* Content bullets */}
            <ul className="mt-3 space-y-2">
              {post.content.slice(0, 4).map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                  className="flex gap-2.5 text-[13.5px] leading-[1.5] text-white/90"
                >
                  <span className="mt-[5px] h-[5px] w-[5px] shrink-0 rounded-full bg-sky-300/80" />
                  <span className="drop-shadow-sm">{item}</span>
                </motion.li>
              ))}
            </ul>

            {/* Author + source row */}
            <div className="mt-4 flex items-center justify-between">
              {post.author ? (
                <Link
                  href={`/profile/${post.author.username}`}
                  className="flex items-center gap-2"
                >
                  <UserAvatar
                    username={post.author.username}
                    avatarUrl={post.author.avatar_url}
                    size="sm"
                  />
                  <div>
                    <p className="text-xs font-bold text-white">
                      {post.author.display_name ?? post.author.username}
                    </p>
                    <p className="text-[10px] text-white/50">
                      ⚡ {post.author.vibe_score ?? 0} vibe
                    </p>
                  </div>
                </Link>
              ) : (
                <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
                  {post.source}
                </p>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex gap-1">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-white/50">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action sidebar */}
          <div className="flex flex-col gap-5 pb-1 shrink-0">
            <ActionButton
              icon={<Zap className={clsx("h-5 w-5", myReactions.has("sparked") ? "fill-current" : "")} />}
              label={reactions.sparked || "Spark"}
              active={myReactions.has("sparked")}
              activeClass="border-amber-300/50 bg-amber-400/20 text-amber-300"
              glow="shadow-amber-500/30"
              onClick={() => toggleReaction("sparked")}
            />
            <ActionButton
              icon={<Flame className={clsx("h-5 w-5", myReactions.has("fired_up") ? "fill-current" : "")} />}
              label={reactions.fired_up || "Fire"}
              active={myReactions.has("fired_up")}
              activeClass="border-orange-300/50 bg-orange-400/20 text-orange-300"
              glow="shadow-orange-500/30"
              onClick={() => toggleReaction("fired_up")}
            />
            <ActionButton
              icon={<Bookmark className={clsx("h-5 w-5", myReactions.has("bookmarked") ? "fill-current" : "")} />}
              label={reactions.bookmarked || "Save"}
              active={myReactions.has("bookmarked")}
              activeClass="border-sky-300/50 bg-sky-400/20 text-sky-300"
              glow="shadow-sky-500/30"
              onClick={() => toggleReaction("bookmarked")}
            />
            <ActionButton
              icon={<MessageCircle className="h-5 w-5" />}
              label={commentsCount || "Talk"}
              onClick={() => setCommentsOpen(true)}
            />
            <ActionButton
              icon={<Share2 className="h-5 w-5" />}
              label={shareLabel}
              onClick={handleShare}
            />
            <ActionButton
              icon={<NotebookPen className={clsx("h-5 w-5", impactLogged ? "fill-current" : "")} />}
              label="Impact"
              active={impactLogged}
              activeClass="border-emerald-300/50 bg-emerald-400/20 text-emerald-300"
              glow="shadow-emerald-500/30"
              onClick={() => setImpactOpen(true)}
            />
          </div>
        </div>

        {/* Progress indicator dots */}
        <AnimatePresence>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-30">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-1 w-1 rounded-full bg-white" />
            ))}
          </div>
        </AnimatePresence>
      </article>

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
