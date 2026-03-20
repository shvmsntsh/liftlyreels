"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Minus, Eye, Send } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { REEL_GRADIENTS } from "@/lib/types";
import clsx from "clsx";

const CATEGORIES = ["Mindset", "Gym", "Diet", "Books", "Wellness", "Finance", "Relationships"];

export default function CreatePage() {
  const [title, setTitle] = useState("");
  const [bullets, setBullets] = useState(["", "", ""]);
  const [category, setCategory] = useState("Mindset");
  const [gradient, setGradient] = useState("ocean");
  const [tags, setTags] = useState("");
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function addBullet() {
    if (bullets.length < 6) setBullets([...bullets, ""]);
  }

  function removeBullet(i: number) {
    if (bullets.length > 2) setBullets(bullets.filter((_, idx) => idx !== i));
  }

  function updateBullet(i: number, val: string) {
    setBullets(bullets.map((b, idx) => (idx === i ? val : b)));
  }

  const validBullets = bullets.filter((b) => b.trim());
  const canSubmit = title.trim() && validBullets.length >= 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");

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
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      setError(data.error ?? "Failed to post reel");
      setLoading(false);
      return;
    }

    router.push("/feed");
  }

  const gradientStyle = REEL_GRADIENTS[gradient];

  return (
    <main className="relative min-h-screen bg-background pb-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_0%,rgba(56,189,248,0.1),transparent)]" />

      {/* Header */}
      <div
        className="sticky top-0 z-20 px-4 py-4 backdrop-blur-xl"
        style={{ backgroundColor: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="mx-auto flex max-w-md items-center justify-between">
          <h1 className="text-lg font-bold text-white">Create Reel</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreview(!preview)}
              className={clsx(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                preview
                  ? "border-sky-400/40 bg-sky-400/10 text-sky-300"
                  : "border-[var(--border)] text-slate-400 hover:text-white"
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-6">
        {preview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-3xl"
            style={{
              minHeight: "480px",
              background: `linear-gradient(135deg, ${gradientStyle.from} 0%, ${gradientStyle.to} 100%)`,
            }}
          >
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
                  {tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tag) => (
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
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-sky-400/50 transition"
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
                        : "border-[var(--border)] text-slate-400 hover:text-white"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Background gradient */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Background
              </label>
              <div className="flex gap-2">
                {Object.entries(REEL_GRADIENTS).map(([key, g]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setGradient(key)}
                    className={clsx(
                      "relative h-10 w-10 rounded-xl transition",
                      gradient === key && "ring-2 ring-white ring-offset-2 ring-offset-background"
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
                    }}
                    title={g.label}
                  />
                ))}
              </div>
            </div>

            {/* Content bullets */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Content Bullets (2–6)
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
                      className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-sky-400/50 transition"
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
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-sky-400/50 transition"
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
