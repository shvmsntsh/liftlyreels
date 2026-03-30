"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, Zap, Flame, Star, Clock } from "lucide-react";
import { validateProof, PROOF_REQUIREMENTS, SUBMIT_LABELS } from "@/lib/proof-validation";
import { StreakCelebration, isMilestone } from "./StreakCelebration";
import { Confetti } from "./Confetti";
import { haptic } from "@/lib/haptics";
import { REEL_GRADIENTS } from "@/lib/types";

const MOTIVATIONAL = [
  "You're building the person you want to be.",
  "Action compounds. This one matters.",
  "Proof > intentions. You just proved it.",
  "Your future self thanks you.",
  "This is what discipline looks like.",
  "One rep closer to who you're becoming.",
  "Real growth happens exactly like this.",
];

const COOLDOWN_SECONDS = 30;
const COOLDOWN_KEY_PREFIX = "liftly-proof-cooldown:";
const DRAFT_KEY_PREFIX = "liftly-proof-draft:";

type Props = {
  postTitle: string;
  postId: string;
  category: string;
  content: string[];
  imageUrl?: string | null;
  gradient?: string | null;
  source?: string | null;
  viewSessionId: number;
  isOpen: boolean;
  onClose: () => void;
  onLogged: (dailyCount: number) => void;
};

export function ActionProofModal({
  postTitle,
  postId,
  category,
  content,
  imageUrl,
  gradient,
  source,
  viewSessionId,
  isOpen,
  onClose,
  onLogged,
}: Props) {
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
  const secondsLeftRef = useRef(COOLDOWN_SECONDS);
  const textRef = useRef("");

  const req = PROOF_REQUIREMENTS[category] ?? { minChars: 30, hint: "Describe what you did in detail" };
  const submitLabel = SUBMIT_LABELS[category] ?? "Log Action";
  const previewGradient = REEL_GRADIENTS[gradient ?? "ocean"] ?? REEL_GRADIENTS.ocean;
  const cooldownKey = `${COOLDOWN_KEY_PREFIX}${postId}:${viewSessionId}`;
  const draftKey = `${DRAFT_KEY_PREFIX}${postId}`;

  useEffect(() => {
    secondsLeftRef.current = secondsLeft;
  }, [secondsLeft]);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    if (!viewSessionId) {
      setSecondsLeft(COOLDOWN_SECONDS);
      return;
    }

    if (isOpen) {
      let remainingSeconds = COOLDOWN_SECONDS;

      if (typeof window !== "undefined") {
        const stored = window.sessionStorage.getItem(cooldownKey);
        const parsed = stored ? Number(stored) : NaN;

        if (Number.isFinite(parsed)) {
          remainingSeconds = Math.min(COOLDOWN_SECONDS, Math.max(0, Math.ceil(parsed)));
        } else {
          window.sessionStorage.setItem(cooldownKey, String(COOLDOWN_SECONDS));
        }
      }

      openedAtRef.current = Date.now() + remainingSeconds * 1000;
      setSecondsLeft(remainingSeconds);
      setError(null);
      setSuccess(false);

      if (typeof window !== "undefined") {
        const storedDraft = window.sessionStorage.getItem(draftKey);
        setText(storedDraft ?? "");
      } else {
        setText("");
      }

      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((openedAtRef.current - Date.now()) / 1000));
        setSecondsLeft(remaining);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(cooldownKey, String(remaining));
        }
        if (remaining <= 0 && timerRef.current) {
          clearInterval(timerRef.current);
        }
      }, 1000);
    } else {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(cooldownKey, String(secondsLeftRef.current));
        window.sessionStorage.setItem(draftKey, textRef.current);
      }
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(cooldownKey, String(secondsLeftRef.current));
        window.sessionStorage.setItem(draftKey, textRef.current);
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldownKey, draftKey, isOpen, viewSessionId]);

  const cooldownDone = secondsLeft <= 0;
  const validation = validateProof(text, category);
  const canSubmit = cooldownDone && validation.valid && !saving && !success;

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
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(cooldownKey, "0");
        window.sessionStorage.removeItem(draftKey);
      }

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
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(draftKey, textRef.current);
    }
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
              className="fixed inset-0 z-[110] bg-black/55 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            <motion.div
              className="fixed inset-0 z-[120] flex flex-col"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
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
                      transition={{ type: "spring", damping: 12, stiffness: 280, delay: 0.05 }}
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
                      className="mt-2 flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/15 px-4 py-1.5"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", delay: 0.32, damping: 14 }}
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

              <div className="relative min-h-0 flex-[0_0_42dvh] overflow-hidden">
                {imageUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(160deg, ${previewGradient.from} 0%, ${previewGradient.to} 100%)`,
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#03131f] via-black/30 to-black/45" />
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-[calc(env(safe-area-inset-top)+16px)] z-10 rounded-full border border-white/10 bg-black/30 p-2 text-slate-200 transition hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-10">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                      {category}
                    </span>
                    {source ? (
                      <span className="max-w-[42%] truncate text-[10px] font-medium uppercase tracking-[0.12em] text-white/55">
                        {source}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="max-w-[88%] text-[1.9rem] font-black leading-[1.02] tracking-tight text-white">
                    {postTitle}
                  </h3>
                  {content.length > 0 ? (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3 backdrop-blur-sm">
                      {content.slice(0, 2).map((line, index) => (
                        <div key={index} className="flex items-start gap-2.5 py-1">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
                          <p className="text-[13px] leading-[1.4] text-white/88">{line}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                className="relative flex min-h-0 flex-1 flex-col rounded-t-[28px] border border-emerald-400/20 border-b-0 bg-[linear-gradient(160deg,#052e16_0%,#0c1a2e_100%)] shadow-[0_-12px_40px_rgba(16,185,129,0.14)]"
              >
                <div className="relative flex shrink-0 items-center justify-center pb-2 pt-3">
                  <div className="h-1 w-10 rounded-full bg-white/20" />
                </div>

                <div className="flex-1 overflow-y-auto px-5 pb-3">
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
                      <p className="text-[11px] text-slate-500">
                        Reel stays fully visible above while you write
                      </p>
                    </div>
                  </div>

                  {!cooldownDone && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4 shrink-0 text-amber-400" />
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
                      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-amber-900/30">
                        <motion.div
                          className="h-full rounded-full bg-amber-400/60"
                          style={{ width: `${((COOLDOWN_SECONDS - secondsLeft) / COOLDOWN_SECONDS) * 100}%` }}
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="mb-3 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5">
                    <p className="mb-0.5 text-[11px] font-semibold text-emerald-300/80">
                      What counts as proof for {category}?
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {req.hint}. Be specific — generic answers are rejected.
                    </p>
                  </div>

                  <textarea
                    value={text}
                    onChange={(e) => {
                      const next = e.target.value.slice(0, 300);
                      setText(next);
                      if (typeof window !== "undefined") {
                        window.sessionStorage.setItem(draftKey, next);
                      }
                    }}
                    placeholder="Describe exactly what you did..."
                    rows={4}
                    disabled={saving || success}
                    className="w-full resize-none rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-400/40 disabled:opacity-40"
                  />

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
                    <p className="mb-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                      {error}
                    </p>
                  )}
                </div>

                <div className="shrink-0 border-t border-white/5 px-5 pb-8 pt-3">
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
