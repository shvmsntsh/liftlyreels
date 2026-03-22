"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, MessageCircle, Share2, Zap, Flame, NotebookPen, UserPlus, UserCheck, Hash } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const viewedRef = useRef(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          play(post.category, post.audio_track);
          // Record view once per mount, debounced
          if (!viewedRef.current && userId && !post.id.startsWith("fallback-")) {
            viewedRef.current = true;
            fetch("/api/views", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ postId: post.id }),
            }).catch(() => {});
          }
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [play, post.category, post.id, userId]);

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
  const [isFollowing, setIsFollowing] = useState(post.author_is_following ?? false);

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

  async function handleFollow() {
    if (!userId || !post.author?.id || post.author.id === userId) return;
    const prev = isFollowing;
    setIsFollowing(!prev);
    await fetch("/api/follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: post.author.id }),
    }).catch(() => setIsFollowing(prev));
  }

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

  // Condense content to a single elegant line
  const subtitle = post.content[0] ?? "";

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
        {/* Top glow */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent" />

        {/* Bottom content */}
        <div className="relative z-10 flex items-end gap-3 px-5 pb-28 pt-8">
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
            <h2 className="text-[1.7rem] font-black leading-[1.12] tracking-tight text-white drop-shadow-lg text-balance">
              {post.title}
            </h2>

            {/* Single elegant subtitle */}
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="mt-2.5 text-[14.5px] leading-[1.5] text-white/75 font-medium tracking-wide"
                style={{ textWrap: "pretty" }}
              >
                {subtitle}
              </motion.p>
            )}

            {/* Clickable tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {post.tags.slice(0, 4).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => router.push(`/search?tag=${encodeURIComponent(tag)}`)}
                    className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/60 backdrop-blur-sm transition hover:bg-white/10 hover:text-white/80 tap-highlight"
                  >
                    <Hash className="h-2.5 w-2.5" />{tag}
                  </button>
                ))}
              </div>
            )}

            {/* Author + follow row */}
            <div className="mt-4 flex items-center gap-3">
              {post.author ? (
                <>
                  <Link
                    href={`/profile/${post.author.username}`}
                    className="flex items-center gap-2.5 min-w-0"
                  >
                    <UserAvatar
                      username={post.author.username}
                      avatarUrl={post.author.avatar_url}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-white truncate">
                        {post.author.display_name ?? post.author.username}
                      </p>
                      <p className="text-[11px] text-white/50">
                        @{post.author.username}
                      </p>
                    </div>
                  </Link>
                  {/* Follow button on reel */}
                  {userId && post.author.id !== userId && (
                    <button
                      onClick={handleFollow}
                      className={clsx(
                        "ml-auto flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all shrink-0",
                        isFollowing
                          ? "border border-white/20 text-white/70"
                          : "bg-sky-500 text-white shadow-[0_2px_8px_rgba(56,189,248,0.3)]"
                      )}
                    >
                      {isFollowing ? (
                        <><UserCheck className="h-3 w-3" /> Following</>
                      ) : (
                        <><UserPlus className="h-3 w-3" /> Follow</>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
                  {post.source}
                </p>
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
            {!post.id.startsWith("fallback-") && (
              <ActionButton
                icon={<NotebookPen className={clsx("h-5 w-5", impactLogged ? "fill-current" : "")} />}
                label="Impact"
                active={impactLogged}
                activeClass="border-emerald-300/50 bg-emerald-400/20 text-emerald-300"
                glow="shadow-emerald-500/30"
                onClick={() => setImpactOpen(true)}
              />
            )}
          </div>
        </div>
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
