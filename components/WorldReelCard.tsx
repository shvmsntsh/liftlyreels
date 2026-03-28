"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, X, ExternalLink, ChevronRight } from "lucide-react";

export type NewsSlide = {
  title: string;
  description: string;
  image_url: string | null;
  source: string;
  category: string;
  emoji: string;
  url: string;
};

type Props = {
  slides: NewsSlide[];
  onDismiss: () => void;
};

// Category → accent color for slides without images
const CAT_COLORS: Record<string, { from: string; to: string }> = {
  "Technology & AI": { from: "#1e3a5f", to: "#0f172a" },
  Business: { from: "#1a2e1a", to: "#0a1f0a" },
  "World News": { from: "#1e2a3a", to: "#0f172a" },
  Science: { from: "#1a1a3f", to: "#0a0a1f" },
  Sport: { from: "#3a1a0a", to: "#1f0a00" },
  Environment: { from: "#1a3a1a", to: "#0a1f0a" },
  "Health & Life": { from: "#3a1a2a", to: "#1f0a15" },
  "Money & Finance": { from: "#2a2a0a", to: "#151500" },
  Culture: { from: "#2a1a3a", to: "#15001f" },
  Education: { from: "#1a2a3a", to: "#0a1520" },
};

// Curated Unsplash photo IDs per category — stable, relevant fallback images
const CAT_UNSPLASH: Record<string, string> = {
  "Technology & AI": "photo-1518770660439-4636190af475",
  Business: "photo-1507679799987-c73779587ccf",
  "World News": "photo-1526778548025-fa2f459cd5c1",
  Science: "photo-1532094349884-543bc11b234d",
  Sport: "photo-1526232761682-d26e03ac148e",
  Environment: "photo-1441974231531-c6227db76b6e",
  "Health & Life": "photo-1571019613454-1cb2f99b2d8b",
  "Money & Finance": "photo-1611974789855-9c2a0a7236a3",
  Culture: "photo-1533929736458-ca588d08c8be",
  Education: "photo-1481627834876-b7833e8f5570",
};

function getFallbackUrl(category: string): string | null {
  const photoId = CAT_UNSPLASH[category];
  if (photoId) return `https://images.unsplash.com/${photoId}?w=800&h=1200&fit=crop&auto=format&q=75`;
  return null;
}

/** Strip any residual HTML tags from text (defense-in-depth for cached dirty data) */
function cleanText(s: string): string {
  return s
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(parseInt(d)))
    .replace(/\s+/g, " ")
    .trim();
}

function IntroSlide() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center px-8 text-center"
      style={{ background: "linear-gradient(160deg, #0a1628 0%, #020817 100%)" }}
    >
      {/* Pulsing globe */}
      <motion.div
        className="mb-8 flex h-24 w-24 items-center justify-center rounded-full"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.2), rgba(56,189,248,0.08))" }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Globe className="h-12 w-12 text-emerald-400" strokeWidth={1.3} />
      </motion.div>

      <motion.p
        className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-400/70"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        World · Last 24 hours
      </motion.p>

      <motion.h1
        className="text-[32px] font-black leading-tight tracking-tight text-white"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        This is what happened
        <br />
        <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
          around the world
        </span>
        <br />
        today.
      </motion.h1>

      <motion.p
        className="mt-6 text-[13px] text-white/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        Top 10 stories · Tap to explore →
      </motion.p>

      {/* Unlock badge */}
      <motion.div
        className="mt-8 flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.55, type: "spring" }}
      >
        <span className="text-sm">🔓</span>
        <span className="text-[12px] font-bold text-emerald-300">
          Unlocked — 5 proofs today!
        </span>
      </motion.div>
    </div>
  );
}

function NewsItemSlide({ item, index }: { item: NewsSlide; index: number }) {
  const colors = CAT_COLORS[item.category] ?? { from: "#1a1a2e", to: "#0a0a1f" };
  const primaryUrl = item.image_url || null;
  const fallbackUrl = getFallbackUrl(item.category);
  const [imgSrc, setImgSrc] = useState<string | null>(primaryUrl || fallbackUrl);
  const [imgFailed, setImgFailed] = useState(false);

  const title = cleanText(item.title);
  const description = cleanText(item.description);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Background */}
      {imgSrc && !imgFailed ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => {
              // If primary failed, try fallback; if fallback also failed, use gradient
              if (imgSrc === primaryUrl && fallbackUrl) {
                setImgSrc(fallbackUrl);
              } else {
                setImgFailed(true);
              }
            }}
          />
          {/* Dark gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(160deg, ${colors.from} 0%, ${colors.to} 100%)` }}
        />
      )}

      {/* Content — pinned to bottom, above safe area */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-16">
        {/* Story number + category */}
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[11px] font-black text-white">
            {index + 1}
          </span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white/80 backdrop-blur-sm">
            {item.emoji} {item.category}
          </span>
          <span className="text-[10px] text-white/40">{item.source}</span>
        </div>

        {/* Headline */}
        <h2 className="mb-3 text-[22px] font-black leading-tight text-white">
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p className="mb-4 text-[13px] leading-relaxed text-white/60 line-clamp-3">
            {description}
          </p>
        )}

        {/* Read more */}
        {item.url && item.url !== "#" && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex w-fit items-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-[12px] font-semibold text-white/70 backdrop-blur-sm hover:bg-white/15 transition-colors"
          >
            Read full story
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

export function WorldReelCard({ slides, onDismiss }: Props) {
  const total = slides.length + 1; // +1 for intro
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  // Dispatch event to hide AudioToggle while WorldReel is open
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("liftly-world-reel", { detail: true }));
    return () => {
      window.dispatchEvent(new CustomEvent("liftly-world-reel", { detail: false }));
    };
  }, []);

  const goNext = useCallback(() => {
    if (current < total - 1) {
      setDirection(1);
      setCurrent((c) => c + 1);
    } else {
      onDismiss();
    }
  }, [current, total, onDismiss]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      setDirection(-1);
      setCurrent((c) => c - 1);
    }
  }, [current]);

  // Auto-advance every 7 seconds
  useEffect(() => {
    const t = setTimeout(goNext, 7000);
    return () => clearTimeout(t);
  }, [current, goNext]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onDismiss]);

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <motion.div
      className="fixed inset-0 z-[150] bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* ── Progress bars ── */}
      <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 px-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/20">
            {i < current ? (
              <div className="h-full w-full bg-white" />
            ) : i === current ? (
              <motion.div
                key={`progress-${current}`}
                className="h-full bg-white"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 7, ease: "linear" }}
              />
            ) : null}
          </div>
        ))}
      </div>

      {/* ── Dismiss button — top right, clear of audio toggle ── */}
      <button
        onClick={onDismiss}
        className="absolute right-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 2rem)" }}
      >
        <X className="h-5 w-5 text-white" />
      </button>

      {/* ── Slides ── */}
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={current}
          className="absolute inset-0"
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.32, 0, 0.67, 0] }}
        >
          {current === 0 ? (
            <IntroSlide />
          ) : (
            <NewsItemSlide item={slides[current - 1]} index={current - 1} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Tap zones (left = back, right = forward) ── */}
      <div className="absolute inset-0 z-10 grid grid-cols-2">
        <button aria-label="Previous" className="h-full w-full" onClick={goPrev} />
        <button aria-label="Next" className="h-full w-full" onClick={goNext} />
      </div>

      {/* ── Slide counter ── */}
      <div className="absolute left-1/2 z-20 -translate-x-1/2 flex items-center gap-2" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}>
        {current < total - 1 ? (
          <button
            onClick={goNext}
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-[12px] font-bold text-white/70 backdrop-blur-sm"
          >
            {current === 0 ? "Start reading" : `${total - current - 1} more`}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={onDismiss}
            className="rounded-full bg-white/10 px-4 py-2 text-[12px] font-bold text-white/70 backdrop-blur-sm"
          >
            Back to feed
          </button>
        )}
      </div>
    </motion.div>
  );
}
