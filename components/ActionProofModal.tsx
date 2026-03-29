"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, Zap, Flame, Star, Clock } from "lucide-react";
import { validateProof, PROOF_REQUIREMENTS, SUBMIT_LABELS } from "@/lib/proof-validation";
import { StreakCelebration, isMilestone } from "./StreakCelebration";
import { Confetti } from "./Confetti";
import { haptic } from "@/lib/haptics";

const MOTIVATIONAL = [
  "You're building the person you want to be.",
  "Action compounds. This one matters.",
  "Proof > intentions. You just proved it.",
  "Your future self thanks you.",
  "This is what discipline looks like.",
  "One rep closer to who you're becoming.",
  "Real growth happens exactly like this.",
];

const COOLDOWN_SECONDS = 90;

type Props = {
  postTitle: string;
  postId: string;
  category: string;
  isOpen: boolean;
  onClose: () => void;
  onLogged: (dailyCount: number) => void;
};

export function ActionProofModal({ postTitle, postId, category, isOpen, onClose, onLogged }: Props) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [motivational, setMotivational] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [milestoneStreak, setMilestoneStreak] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SECONDS);
  const openedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const req = PROOF_REQUIREMENTS[category] ?? { minChars: 30, hint: "Describe what you did in detail" };
  const submitLabel = SUBMIT_LABELS[category] ?? "Log Action";

  // Start cooldown when modal opens
  useEffect(() => {
    if (isOpen) {
      openedAtRef.current = Date.now();
      setSecondsLeft(COOLDOWN_SECONDS);
      setText("");
      setError(null);
      setSuccess(false);

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - openedAtRef.current) / 1000);
        const remaining = Math.max(0, COOLDOWN_SECONDS - elapsed);
        setSecondsLeft(remaining);
        if (remaining <= 0 && timerRef.current) {
          clearInterval(timerRef.current);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  const cooldownDone = secondsLeft <= 0;
  const validation = validateProof(text, category);
  const canSubmit = cooldownDone && validation.valid && !saving && !success;

  // Character count color
  const charColor =
    text.trim().length === 0
      ? "var(--muted)"
      : text.trim().length < req.minChars
      ? "#ef4444"
      : text.trim().length < req.minChars + 20
      ? "#f59e0b"
      : "#22c55e";

  async function handleSubmit() {
    if (!canSubmit) return;

    const result = validateProof(text, category);
    if (!result.valid) {
      setError(result.error ?? "Invalid proof");
      haptic("error");
      return;
    }

    haptic("medium");
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, actionTaken: text.trim(), category }),
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

      setMotivational(MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)]);
      haptic("success");
      setShowConfetti(true);
      setSuccess(true);

      if (data?.streak && isMilestone(data.streak)) {
        setMilestoneStreak(data.streak);
      }

      const dc = data?.daily_count ?? 0;
      setTimeout(() => {
        setShowConfetti(false);
        onLogged(dc);
        setSuccess(false);
        setText("");
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
            <motion.div
              className="fixed inset-0 z-[110] bg-black/5 backdrop-blur-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            <motion.div
              className="fixed inset-x-3 z-[110] mx-auto max-w-md overflow-y-auto rounded-t-3xl max-h-[50vh]"
              style={{
                bottom: 0,
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
                    <motion.div
                      className="absolute inset-0"
                      style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(16,185,129,0.18), transparent)" }}
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: 1 }}
                      transition={{ duration: 0.6 }}
                    />

                    <motion.div
                      initial={{ scale: 0.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring" as const, damping: 12, stiffness: 280, delay: 0.05 }}
                    >
                      <div className="relative flex h-24 w-24 items-center justify-center">
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
                      Proved It!
                    </motion.p>

                    <motion.div
                      className="mt-2 flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/25 px-4 py-1.5"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring" as const, delay: 0.32, damping: 14 }}
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-sm font-bold text-amber-300">+3 Vibe earned</span>
                    </motion.div>

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
                      Streak updated
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

                {/* Cooldown timer */}
                {!cooldownDone && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                      <div className="flex-1">
                        <p className="text-[12px] font-semibold text-amber-200">
                          Engage with the reel first
                        </p>
                        <p className="text-[11px] text-amber-400/70">
                          Read it carefully before proving you did it
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold tabular-nums text-amber-300">
                          {secondsLeft}
                        </span>
                        <span className="text-[10px] text-amber-400/60">s</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2.5 h-1 rounded-full bg-amber-900/30 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-amber-400/60"
                        style={{ width: `${((COOLDOWN_SECONDS - secondsLeft) / COOLDOWN_SECONDS) * 100}%` }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Category-specific prompt */}
                <div className="mb-3 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5">
                  <p className="text-[11px] font-semibold text-emerald-300/80 mb-0.5">
                    What counts as proof for {category}?
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {req.hint}. Be specific — generic answers are rejected.
                  </p>
                </div>

                {/* Textarea */}
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 300))}
                  placeholder={`Describe exactly what you did...`}
                  rows={3}
                  disabled={saving || success}
                  className="w-full resize-none rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-400/40 transition disabled:opacity-40"
                />

                {/* Character count + validation hint */}
                <div className="mb-2 mt-1 flex items-center justify-between">
                  <div className="text-[10px] text-slate-600">
                    {text.trim().length > 0 && !validation.valid && (
                      <span className="text-red-400">{validation.error}</span>
                    )}
                  </div>
                  <span className="text-[10px] tabular-nums" style={{ color: charColor }}>
                    {text.length}/300 (min {req.minChars})
                  </span>
                </div>

                {error && (
                  <p className="mb-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                    {error}
                  </p>
                )}

                <motion.button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
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
                  ) : !cooldownDone ? (
                    `Wait ${secondsLeft}s...`
                  ) : (
                    `${submitLabel} — +3 Vibe`
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
