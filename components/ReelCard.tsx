"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Heart, Share2 } from "lucide-react";
import clsx from "clsx";
import { PostRecord } from "@/lib/types";
import {
  LIKED_POSTS_KEY,
  SAVED_POSTS_KEY,
  readStoredIds,
  writeStoredIds,
} from "@/utils/storage";

type ReelCardProps = {
  post: PostRecord;
};

function ActionButton({
  active,
  label,
  count,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  count: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={clsx(
        "flex h-14 w-14 flex-col items-center justify-center rounded-full border text-[11px] transition",
        active
          ? "border-sky-300/60 bg-sky-400/15 text-sky-200"
          : "border-white/15 bg-slate-950/45 text-white hover:bg-slate-900/70",
      )}
    >
      {children}
      <span className="mt-1">{count}</span>
    </button>
  );
}

export function ReelCard({ post }: ReelCardProps) {
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [shareLabel, setShareLabel] = useState("Share");

  useEffect(() => {
    setLikedIds(readStoredIds(LIKED_POSTS_KEY));
    setSavedIds(readStoredIds(SAVED_POSTS_KEY));
  }, []);

  const isLiked = likedIds.includes(post.id);
  const isSaved = savedIds.includes(post.id);
  const likeLabel = useMemo(() => (isLiked ? "Liked" : "Like"), [isLiked]);
  const saveLabel = useMemo(() => (isSaved ? "Saved" : "Save"), [isSaved]);

  function toggleStoredId(ids: string[], setIds: (next: string[]) => void, key: string) {
    const nextIds = ids.includes(post.id)
      ? ids.filter((id) => id !== post.id)
      : [...ids, post.id];

    setIds(nextIds);
    writeStoredIds(key, nextIds);
  }

  async function handleShare() {
    const shareUrl =
      typeof window === "undefined"
        ? ""
        : `${window.location.origin}/feed#${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.content[0],
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }

      setShareLabel("Copied");
    } catch {
      setShareLabel("Retry");
    }

    window.setTimeout(() => setShareLabel("Share"), 1800);
  }

  return (
    <motion.article
      id={post.id}
      initial={{ opacity: 0.65, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="snap-start relative flex min-h-screen items-end overflow-hidden px-4 pb-28 pt-8 sm:px-6"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: post.image_url ? `url(${post.image_url})` : undefined,
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.18)_0%,rgba(2,6,23,0.68)_45%,rgba(2,6,23,0.96)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_72%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-md items-end gap-4">
        <div className="flex-1 rounded-[2rem] border border-white/10 bg-slate-950/45 p-5 shadow-2xl shadow-black/30 backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
              {post.category}
            </span>
            <span className="text-xs uppercase tracking-[0.22em] text-slate-400">
              {post.source}
            </span>
          </div>

          <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
            {post.title}
          </h2>

          <ul className="mt-5 space-y-3">
            {post.content.slice(0, 5).map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-slate-100">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-2 flex flex-col gap-3">
          <ActionButton
            active={isLiked}
            label="Like post"
            count={likeLabel}
            onClick={() => toggleStoredId(likedIds, setLikedIds, LIKED_POSTS_KEY)}
          >
            <Heart className={clsx("h-5 w-5", isLiked && "fill-current")} />
          </ActionButton>
          <ActionButton
            active={isSaved}
            label="Save post"
            count={saveLabel}
            onClick={() => toggleStoredId(savedIds, setSavedIds, SAVED_POSTS_KEY)}
          >
            <Bookmark className={clsx("h-5 w-5", isSaved && "fill-current")} />
          </ActionButton>
          <ActionButton label="Share post" count={shareLabel} onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </ActionButton>
        </div>
      </div>
    </motion.article>
  );
}
