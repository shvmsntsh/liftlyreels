"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, Zap, Flame, Star } from "lucide-react";
import { ACTION_TEMPLATES } from "@/lib/types";
import { StreakCelebration, isMilestone } from "./StreakCelebration";
import { Confetti } from "./Confetti";
import { haptic } from "@/lib/haptics";

const MOTIVATIONAL = [
  "You're building the person you want to be. 🔥",
  "Action compounds. This one matters. ⚡",
  "Proof > intentions. You just proved it. 💪",
  "Your future self thanks you. 🚀",
  "This is what discipline looks like. 🏆",
  "One rep closer to who you're becoming. ✨",
  "Real growth happens exactly like this. 🌱",
];

type Props = {
  postTitle: string;
  postId: string;
  category: string;
  isOpen: boolean;
  onClose: () => void;
  onLogged: (dailyCount: number) => void;
};

export function ActionProofModal({ postTitle, postId, category, isOpen, onClose, onLogged }: Props) {
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [motivational, setMotivational] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [milestoneStreak, setMilestoneStreak] = useState<number | null>(null);

  const templates = (ACTION_TEMPLATES[category] ?? ACTION_TEMPLATES.Mindset).slice(0, 6);

  async function handleLog(text: string) {
    if (!text.trim() || saving || success) return;
    haptic("medium");
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, actionTaken: text.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        haptic("error");
        setError(body?.error ?? "Failed to log. Please try again.");
        setSaving(false);
        return;
      }

      const data = await res.json().catch(() => null);
      setSaving(false);

      // Pick random motivational message
      setMotivational(MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)]);

      // Haptic success pattern + confetti
      haptic("success");
      setShowConfetti(true);
      setSuccess(true);

      if (data?.streak && isMilestone(data.streak)) {
        setMilestoneStreak(data.streak);
      }

      // Auto-close after success animation
      const dc = data?.daily_count ?? 0;
      setTimeout(() => {
        setShowConfetti(false);
        onLogged(dc);
        setSuccess(false);
        setCustom("");
      }, 2000);
    } catch {
      haptic("error");
      setError("Network error. Check your connection.");
      setSaving(false);
    }
  }

  function handleClose() {
    if (saving || success) return;
    haptic("light");
    onClose();
  }

  return (
    <>
      <Confetti show={showConfetti} count={50} />

      <StreakCelebration
        streak={milestoneStreak ?? 0}
        show={milestoneStreak !== null}
        onDone={() => setMilestoneStreak(null)}
      />

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            {/* Sheet */}
            <motion.div
              className="fixed inset-x-3 z-[110] mx-auto max-w-md overflow-hidden rounded-3xl"
              style={{
                bottom: "calc(var(--nav-height) + var(--safe-bottom) + 0.5rem)",
                background: "linear-gradient(160deg, #052e16 0%, #0c1a2e 100%)",
                border: "1px solid rgba(74,222,128,0.2)",
                boxShadow: "0 -8px 40px rgba(16,185,129,0.15), 0 20px 60px rgba(0,0,0,0.5)",
              }}
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              transition={{ type: "spring" as const, damping: 26, stiffness: 380 }}
            >
              {/* ── Success overlay ── */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
                    style={{ background: "linear-gradient(160deg, #052e16 0%, #0c1a2e 100%)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Glow burst */}
                    <motion.div
                      className="absolute inset-0"
                      style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(16,185,129,0.18), transparent)" }}
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: 1 }}
                      transition={{ duration: 0.6 }}
                    />

                    {/* Check icon */}
                    <motion.div
                      initial={{ scale: 0.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring" as const, damping: 12, stiffness: 280, delay: 0.05 }}
                    >
                      <div className="relative flex h-24 w-24 items-center justify-center">
                        {/* Ring pulse */}
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-emerald-400/30"
                          animate={{ scale: [1, 1.6], opacity: [0.8, 0] }}
                          transition={{ duration: 0.8, repeat: 2 }}
                        />
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
                          <CheckCircle className="h-10 w-10 text-emerald-400" strokeWidth={1.8} />
                        </div>
                      </div>
                    </motion.div>

                    <motion.p
                      className="mt-3 text-2xl font-black text-white"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      Proved It! 🔥
                    </motion.p>

                    {/* Vibe badge */}
                    <motion.div
                      className="mt-2 flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/25 px-4 py-1.5"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring" as const, delay: 0.32, damping: 14 }}
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-sm font-bold text-amber-300">+3 Vibe earned</span>
                    </motion.div>

                    {/* Stars row */}
                    <motion.div
                      className="mt-3 flex gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45 }}
                    >
                      {[0, 0.08, 0.16].map((delay, i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: [0, 1.3, 1], rotate: [0, 20, 0] }}
                          transition={{ delay: 0.45 + delay, duration: 0.4 }}
                        >
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Motivational message */}
                    <motion.p
                      className="mt-4 max-w-[240px] text-sm leading-relaxed text-slate-400"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 }}
                    >
                      {motivational}
                    </motion.p>

                    <motion.p
                      className="mt-3 text-[11px] text-slate-600"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      Streak updated ✓
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-5">
                {/* Close */}
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 z-10 rounded-full p-1 text-slate-400 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Header */}
                <div className="mb-4 flex items-center gap-2.5">
                  <motion.div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/15"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Flame className="h-5 w-5 text-emerald-400" />
                  </motion.div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Prove It · +3 Vibe
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{postTitle}</p>
                  </div>
                </div>

                {/* Quick-tap templates — one tap logs instantly */}
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                  ⚡ Tap to log instantly
                </p>
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {templates.map((t) => (
                    <motion.button
                      key={t}
                      onClick={() => handleLog(t)}
                      disabled={saving || success}
                      whileTap={{ scale: 0.93 }}
                      className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-3 text-left text-[12px] font-semibold leading-tight text-emerald-200 transition-all hover:border-emerald-400/40 hover:bg-emerald-500/18 disabled:opacity-30"
                    >
                      {t}
                    </motion.button>
                  ))}
                </div>

                {/* Custom entry */}
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                  Or describe it yourself
                </p>
                <textarea
                  value={custom}
                  onChange={(e) => setCustom(e.target.value.slice(0, 140))}
                  placeholder="What did you actually do? Be specific..."
                  rows={2}
                  disabled={saving || success}
                  className="w-full resize-none rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-400/40 transition disabled:opacity-40"
                />
                <div className="mb-2 mt-1 text-right text-[10px] text-slate-700">{custom.length}/140</div>

                {error && (
                  <p className="mb-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                    {error}
                  </p>
                )}

                <motion.button
                  onClick={() => handleLog(custom)}
                  disabled={!custom.trim() || saving || success}
                  whileTap={{ scale: 0.97 }}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition hover:brightness-110 disabled:opacity-30 disabled:shadow-none"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                      />
                      Logging...
                    </span>
                  ) : (
                    "Log It — +3 Vibe ⚡"
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
