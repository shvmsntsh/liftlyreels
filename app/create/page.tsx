"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, Eye, Send, Play, Pause, Image as ImageIcon, Music } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { REEL_GRADIENTS } from "@/lib/types";
import { AUDIO_TRACKS, CURATED_BACKGROUNDS, type AudioTrack, type BackgroundOption } from "@/lib/audio-tracks";
import clsx from "clsx";

const CATEGORIES = ["Mindset", "Gym", "Diet", "Books", "Wellness", "Finance", "Relationships"];

export default function CreatePage() {
  const [title, setTitle] = useState("");
  const [bullets, setBullets] = useState(["", "", ""]);
  const [category, setCategory] = useState("Mindset");
  const [gradient, setGradient] = useState("ocean");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioTrack, setAudioTrack] = useState<string | null>(null);
  const [tags, setTags] = useState("");
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Audio preview
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState<string | null>(null);

  // Auto-select first audio track when category changes
  useEffect(() => {
    const match = AUDIO_TRACKS.find((t) => t.category === category);
    if (match) setAudioTrack(match.id);
  }, [category]);

  function addBullet() {
    if (bullets.length < 6) setBullets([...bullets, ""]);
  }

  function removeBullet(i: number) {
    if (bullets.length > 2) setBullets(bullets.filter((_, idx) => idx !== i));
  }

  function updateBullet(i: number, val: string) {
    setBullets(bullets.map((b, idx) => (idx === i ? val : b)));
  }

  function toggleAudioPreview(track: AudioTrack) {
    if (previewPlaying === track.id) {
      previewAudioRef.current?.pause();
      setPreviewPlaying(null);
      return;
    }
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio();
      previewAudioRef.current.loop = true;
      previewAudioRef.current.volume = 0.5;
    }
    previewAudioRef.current.src = track.url;
    previewAudioRef.current.play().then(() => setPreviewPlaying(track.id)).catch(() => {});
  }

  function selectBackground(bg: BackgroundOption) {
    if (bg.type === "gradient" && bg.gradientKey) {
      setGradient(bg.gradientKey);
      setImageUrl(null);
    } else if (bg.type === "photo" && bg.url) {
      setImageUrl(bg.url);
    }
  }

  // Cleanup preview audio on unmount
  useEffect(() => {
    return () => {
      previewAudioRef.current?.pause();
      previewAudioRef.current = null;
    };
  }, []);

  const validBullets = bullets.filter((b) => b.trim());
  const canSubmit = title.trim() && validBullets.length >= 2;

  // Tracks for this category + all other tracks
  const categoryTracks = AUDIO_TRACKS.filter((t) => t.category === category);
  const otherTracks = AUDIO_TRACKS.filter((t) => t.category !== category);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");

    // Stop preview audio
    previewAudioRef.current?.pause();
    setPreviewPlaying(null);

    const tagList = tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 5);

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        content: validBullets,
        category,
        tags: tagList,
        gradient,
        audio_track: audioTrack,
        image_url: imageUrl,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      setError(data.error ?? "Failed to post reel");
      setLoading(false);
      return;
    }

    window.location.href = "/feed";
  }

  const gradientStyle = REEL_GRADIENTS[gradient] ?? REEL_GRADIENTS.ocean;
  const previewBg = imageUrl
    ? undefined
    : `linear-gradient(135deg, ${gradientStyle.from} 0%, ${gradientStyle.to} 100%)`;

  return (
    <main className="relative min-h-screen bg-background pb-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_0%,rgba(56,189,248,0.1),transparent)]" />

      {/* Header */}
      <div
        className="sticky top-0 z-20 px-4 py-4 backdrop-blur-xl"
        style={{ backgroundColor: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="mx-auto flex max-w-md items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Create Reel</h1>
          <button
            onClick={() => setPreview(!preview)}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
              preview
                ? "border-sky-400/40 bg-sky-400/10 text-sky-300"
                : "border-[var(--border)] text-muted hover:text-foreground"
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-6">
        {preview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-3xl"
            style={{ minHeight: "480px", background: previewBg }}
          >
            {imageUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${imageUrl})` }}
              />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.1)_0%,rgba(2,6,23,0.85)_100%)]" />
            <div className="relative z-10 p-6 pt-12">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-sky-200">
                  {category}
                </span>
                <span className="text-[11px] uppercase tracking-widest text-slate-400">
                  Community
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white">
                {title || "Your reel title"}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {(validBullets.length > 0 ? validBullets : ["Your insight goes here..."]).map(
                  (item, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-6 text-slate-100">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
                      <span>{item}</span>
                    </li>
                  )
                )}
              </ul>
              {tags && (
                <div className="mt-4 flex flex-wrap gap-1">
                  {tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                    <span key={tag} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {audioTrack && (
                <div className="mt-4 flex items-center gap-2 text-[11px] text-white/40">
                  <Music className="h-3 w-3" />
                  {AUDIO_TRACKS.find((t) => t.id === audioTrack)?.label ?? "Audio"}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's the core insight?"
                maxLength={80}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-foreground placeholder:text-muted outline-none focus:border-sky-400/50 transition"
                required
              />
              <div className="mt-1 text-right text-[10px] text-slate-600">{title.length}/80</div>
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={clsx(
                      "rounded-full border px-3 py-1 text-xs font-semibold transition",
                      category === cat
                        ? "border-sky-400/50 bg-sky-400/15 text-sky-300"
                        : "border-[var(--border)] text-muted hover:text-foreground"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Background */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <ImageIcon className="h-3.5 w-3.5" /> Background
              </label>
              <div className="grid grid-cols-6 gap-2">
                {CURATED_BACKGROUNDS.map((bg) => {
                  const isSelected =
                    (bg.type === "gradient" && bg.gradientKey === gradient && !imageUrl) ||
                    (bg.type === "photo" && bg.url === imageUrl);
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => selectBackground(bg)}
                      className={clsx(
                        "relative aspect-square rounded-xl overflow-hidden transition",
                        isSelected && "ring-2 ring-white ring-offset-2 ring-offset-background"
                      )}
                      style={{ background: bg.previewCss }}
                      title={bg.label}
                    >
                      {bg.type === "photo" && (
                        <div className="absolute inset-0 flex items-end p-0.5">
                          <ImageIcon className="h-2.5 w-2.5 text-white/60" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Audio Track */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Music className="h-3.5 w-3.5" /> Audio Track
              </label>
              {/* Category tracks first */}
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Matched for {category}
              </p>
              <div className="space-y-1.5 mb-3">
                {categoryTracks.map((track) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    selected={audioTrack === track.id}
                    playing={previewPlaying === track.id}
                    onSelect={() => setAudioTrack(track.id)}
                    onPreview={() => toggleAudioPreview(track)}
                  />
                ))}
              </div>
              {/* Other tracks */}
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                All Tracks
              </p>
              <div className="space-y-1.5">
                {otherTracks.map((track) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    selected={audioTrack === track.id}
                    playing={previewPlaying === track.id}
                    onSelect={() => setAudioTrack(track.id)}
                    onPreview={() => toggleAudioPreview(track)}
                  />
                ))}
              </div>
              {/* None option */}
              <button
                type="button"
                onClick={() => {
                  setAudioTrack(null);
                  previewAudioRef.current?.pause();
                  setPreviewPlaying(null);
                }}
                className={clsx(
                  "mt-2 w-full rounded-xl border px-3 py-2 text-left text-xs transition",
                  audioTrack === null
                    ? "border-sky-400/40 bg-sky-400/10 text-sky-300"
                    : "border-[var(--border)] text-slate-500 hover:text-slate-300"
                )}
              >
                No audio
              </button>
            </div>

            {/* Content bullets */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Content Bullets (2-6)
              </label>
              <div className="space-y-2">
                {bullets.map((b, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="mt-3.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                    <input
                      type="text"
                      value={b}
                      onChange={(e) => updateBullet(i, e.target.value)}
                      placeholder={`Insight ${i + 1}...`}
                      maxLength={120}
                      className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-sky-400/50 transition"
                    />
                    {bullets.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeBullet(i)}
                        className="mt-1 rounded-lg p-1.5 text-slate-500 hover:text-rose-400"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {bullets.length < 6 && (
                <button
                  type="button"
                  onClick={addBullet}
                  className="mt-2 flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300"
                >
                  <Plus className="h-3.5 w-3.5" /> Add bullet
                </button>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tags <span className="normal-case text-slate-600">(comma-separated, optional)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="discipline, morning routine, focus"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-foreground placeholder:text-muted outline-none focus:border-sky-400/50 transition"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-rose-950/50 border border-rose-500/30 px-4 py-2 text-sm text-rose-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-4 text-sm font-bold text-white transition hover:bg-sky-400 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              {loading ? "Posting..." : "Post Reel +2 Vibe"}
            </button>
          </form>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

function TrackRow({
  track,
  selected,
  playing,
  onSelect,
  onPreview,
}: {
  track: AudioTrack;
  selected: boolean;
  playing: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-xl border px-3 py-2 transition",
        selected
          ? "border-sky-400/40 bg-sky-400/10"
          : "border-[var(--border)] bg-[var(--surface-2)]"
      )}
    >
      <button
        type="button"
        onClick={onPreview}
        className={clsx(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition",
          playing
            ? "bg-sky-500 text-white"
            : "bg-white/5 text-muted hover:text-foreground"
        )}
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 text-left min-w-0"
      >
        <p className={clsx("text-xs font-semibold truncate", selected ? "text-sky-300" : "text-foreground")}>
          {track.label}
        </p>
        <p className="text-[10px] text-slate-500">{track.category}</p>
      </button>
      {selected && (
        <span className="shrink-0 rounded-full bg-sky-500/20 px-2 py-0.5 text-[9px] font-bold text-sky-300">
          Selected
        </span>
      )}
    </div>
  );
}
