"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, MessageCircle, Share2, Zap, Flame, CheckCircle, UserPlus, UserCheck, Hash, Flag } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PostRecord, ReactionType, REEL_GRADIENTS } from "@/lib/types";
import { haptic } from "@/lib/haptics";
import { UserAvatar } from "./UserAvatar";
import { CommentsSheet } from "./CommentsSheet";
import { ReportSheet } from "./ReportSheet";
import { useAudio } from "./AudioProvider";
import { ActionProofModal } from "./ActionProofModal";

type ActionButtonProps = {
  icon: React.ReactNode;
  label: string | number;
  onClick?: () => void;
  active?: boolean;
  activeClass?: string;
  activeTextClass?: string;
  glow?: string;
};

function ActionButton({ icon, label, onClick, active, activeClass, activeTextClass, glow }: ActionButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        haptic("light");
        setPressed(true);
        setTimeout(() => setPressed(false), 200);
        onClick?.();
      }}
      className={clsx(
        "flex flex-col items-center gap-1.5 tap-highlight",
        active ? activeTextClass : "text-white"
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
  onActionLogged?: (dailyCount: number) => void;
  dailyLimitReached?: boolean;
  onModalOpen?: (open: boolean) => void;
};

export function ReelCard({ post, userId, onActionLogged, dailyLimitReached, onModalOpen }: Props) {
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
  const [actionOpen, setActionOpen] = useState(false);
  const [actionLogged, setActionLogged] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share");
  const [isFollowing, setIsFollowing] = useState(post.author_is_following ?? false);
  const [reportOpen, setReportOpen] = useState(false);

  const gradient = REEL_GRADIENTS[post.gradient ?? "ocean"] ?? REEL_GRADIENTS.ocean;
  const isFallback = post.id.startsWith("fallback-");

  // Fetch proof status on mount — persist across reloads
  useEffect(() => {
    if (!userId || isFallback) return;
    fetch(`/api/impact?postId=${post.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.proved) setActionLogged(true); })
      .catch(() => {});
  }, [userId, post.id, isFallback]);

  // Lock feed scroll when proof modal is open
  useEffect(() => {
    onModalOpen?.(actionOpen);
    return () => {
      if (actionOpen) onModalOpen?.(false);
    };
  }, [actionOpen, onModalOpen]);

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
        : `${window.location.origin}/r/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: `${post.content[0] ?? ""} — Liftly`, url });
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
        className="snap-start relative flex h-[100dvh] flex-col justify-end overflow-hidden"
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

        {/* Deep gradient — more opaque at bottom to support content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
        {/* Top glow */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent" />

        {/* Bottom content */}
        <div className="relative z-10 flex items-end gap-3 px-4 pb-4 pt-8">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Category + community badges */}
            <div className="mb-2.5 flex items-center gap-2 flex-wrap">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
                {post.category}
              </span>
              {post.is_user_created && (
                <span className="rounded-full border border-violet-300/30 bg-violet-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                  Community
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-[1.55rem] font-black leading-[1.15] tracking-tight text-white drop-shadow-lg">
              {post.title}
            </h2>

            {/* Content points — all shown in frosted glass card */}
            {post.content.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.35 }}
                className="mt-3 rounded-2xl overflow-hidden"
                style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {post.content.map((line, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 px-3.5 py-2.5"
                    style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,0.06)" } : undefined}
                  >
                    <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white/50">
                      {i + 1}
                    </span>
                    <p className="text-[13.5px] leading-[1.45] text-white/90 font-medium">
                      {line}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Tags */}
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
            <div className="mt-3 flex items-center gap-3">
              {post.author ? (
                <>
                  <Link
                    href={`/profile/${post.author.username}`}
                    className="flex items-center gap-2 min-w-0"
                  >
                    <UserAvatar
                      username={post.author.username}
                      avatarUrl={post.author.avatar_url}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-white truncate">
                        {post.author.display_name ?? post.author.username}
                      </p>
                      <p className="text-[10px] text-white/45">@{post.author.username}</p>
                    </div>
                  </Link>
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
                      {isFollowing ? <><UserCheck className="h-3 w-3" /> Following</> : <><UserPlus className="h-3 w-3" /> Follow</>}
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
              activeTextClass="text-amber-300"
              glow="shadow-amber-500/30"
              onClick={() => toggleReaction("sparked")}
            />
            <ActionButton
              icon={<Flame className={clsx("h-5 w-5", myReactions.has("fired_up") ? "fill-current" : "")} />}
              label={reactions.fired_up || "Fire"}
              active={myReactions.has("fired_up")}
              activeClass="border-orange-300/50 bg-orange-400/20 text-orange-300"
              activeTextClass="text-orange-300"
              glow="shadow-orange-500/30"
              onClick={() => toggleReaction("fired_up")}
            />
            <ActionButton
              icon={<Bookmark className={clsx("h-5 w-5", myReactions.has("bookmarked") ? "fill-current" : "")} />}
              label={reactions.bookmarked || "Save"}
              active={myReactions.has("bookmarked")}
              activeClass="border-sky-300/50 bg-sky-400/20 text-sky-300"
              activeTextClass="text-sky-300"
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
            {!isFallback && userId && (
              <ActionButton
                icon={<Flag className="h-4 w-4 opacity-50" />}
                label="Report"
                onClick={() => setReportOpen(true)}
              />
            )}
          </div>
        </div>

        {/* Hero CTA: "I Did This" */}
        {!isFallback && (
          <div className="relative z-10 px-4 pb-nav">
            {actionLogged ? (
              <div className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 px-4 text-[15px] font-bold"
                style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                <CheckCircle className="h-5 w-5 fill-current" />
                Proved It! ✓
              </div>
            ) : dailyLimitReached ? (
              <div className="flex w-full items-center justify-center rounded-2xl py-3.5 px-4 text-[15px] font-bold text-center"
                style={{ backgroundColor: "rgba(156, 163, 175, 0.1)", color: "var(--muted)" }}>
                Daily limit reached (5/5)
              </div>
            ) : (
              <motion.button
                onClick={() => { haptic("medium"); setActionOpen(true); }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold transition-all active:scale-[0.97] bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_4px_24px_rgba(16,185,129,0.45)]"
                whileTap={{ scale: 0.96 }}
                animate={{ boxShadow: ["0 4px 24px rgba(16,185,129,0.45)", "0 4px 32px rgba(16,185,129,0.65)", "0 4px 24px rgba(16,185,129,0.45)"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <CheckCircle className="h-5 w-5" />
                I Did This
              </motion.button>
            )}
          </div>
        )}
      </article>

      <CommentsSheet
        postId={post.id}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        commentsCount={commentsCount}
        onCountChange={setCommentsCount}
      />

      <ActionProofModal
        postId={post.id}
        postTitle={post.title}
        category={post.category}
        isOpen={actionOpen}
        onClose={() => setActionOpen(false)}
        onLogged={(dailyCount) => {
          setActionLogged(true);
          setActionOpen(false);
          onActionLogged?.(dailyCount);
        }}
      />

      <ReportSheet
        postId={post.id}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </>
  );
}
