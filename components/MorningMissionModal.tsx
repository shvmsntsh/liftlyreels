"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Target, Zap } from "lucide-react";

const INTENTIONS = [
  "Hit the gym today 💪",
  "Eat clean all day 🥗",
  "No phone first hour ☀️",
  "Complete the daily challenge ⚡",
  "Meditate 10 minutes 🧘",
  "Read 20 pages 📖",
  "Drink 2L of water 💧",
  "Cold shower 🚿",
];

type Props = {
  challengeText?: string | null;
};

export function MorningMissionModal({ challengeText }: Props) {
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [committed, setCommitted] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const seen = localStorage.getItem("liftly-mission-date");
    const tourCompleted = localStorage.getItem("liftly-tour-complete");
    const seenThisSession = sessionStorage.getItem("liftly-mission-session");
    const hour = new Date().getHours();
    // Show between 5am–11am OR if never seen today
    if (tourCompleted && seen !== today && !seenThisSession && hour >= 5) {
      // Slight delay so feed loads first
      const t = setTimeout(() => {
        localStorage.setItem("liftly-mission-open", "1");
        sessionStorage.setItem("liftly-mission-session", "1");
        setShow(true);
      }, 1200);
      return () => {
        localStorage.removeItem("liftly-mission-open");
        clearTimeout(t);
      };
    }
  }, []);

  function dismiss() {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("liftly-mission-date", today);
    localStorage.removeItem("liftly-mission-open");
    setShow(false);
  }

  function commit() {
    const intention = custom.trim() || selected;
    if (!intention) return;
    // Save intention for today
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("liftly-mission-date", today);
    localStorage.setItem("liftly-mission-intention", intention);
    localStorage.removeItem("liftly-mission-open");
    setCommitted(true);
    setTimeout(() => setShow(false), 1400);
  }

  const canCommit = Boolean(selected || custom.trim());

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />
          <motion.div
            className="fixed inset-x-4 top-[15%] z-[201] mx-auto max-w-md overflow-hidden rounded-3xl"
            style={{
              background: "linear-gradient(145deg, #0f1a2e 0%, #0a0f1e 100%)",
              border: "1px solid rgba(251,191,36,0.2)",
            }}
            initial={{ scale: 0.9, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
          >
            {/* Dismiss */}
            <button
              onClick={dismiss}
              className="absolute right-4 top-4 z-20 text-slate-500 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6">
              {committed ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-4 text-center"
                >
                  <div className="mb-3 text-4xl">🔥</div>
                  <p className="text-lg font-black text-white">Mission locked in.</p>
                  <p className="mt-1 text-sm text-amber-300">Go prove it today.</p>
                </motion.div>
              ) : (
                <>
                  {/* Header */}
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/15 text-amber-400">
                      <Flame className="h-5 w-5 fill-current" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">
                        {new Date().getHours() < 12 ? "Good morning." : "Ready to act?"}
                      </p>
                      <p className="text-[11px] text-slate-500">Set your intention for today</p>
                    </div>
                  </div>

                  {/* Today's challenge */}
                  {challengeText && (
                    <button
                      onClick={() => setSelected(challengeText)}
                      className={`mb-4 w-full rounded-2xl border p-3 text-left transition ${
                        selected === challengeText
                          ? "border-amber-400/40 bg-amber-400/10"
                          : "border-orange-400/20 bg-orange-950/20 hover:bg-orange-950/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-orange-400" />
                        <p className="text-[11px] font-semibold text-orange-300">Today&apos;s Challenge</p>
                      </div>
                      <p className="mt-1 text-sm text-slate-200">{challengeText}</p>
                    </button>
                  )}

                  {/* Quick picks */}
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {INTENTIONS.map((i) => (
                      <button
                        key={i}
                        onClick={() => { setSelected(i); setCustom(""); }}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                          selected === i
                            ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
                            : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>

                  {/* Custom */}
                  <input
                    type="text"
                    value={custom}
                    onChange={(e) => { setCustom(e.target.value.slice(0, 80)); setSelected(null); }}
                    placeholder="Or write your own mission..."
                    className="mb-4 w-full rounded-xl border border-white/10 bg-[var(--input-bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-amber-400/40"
                  />

                  {/* CTA */}
                  <button
                    onClick={commit}
                    disabled={!canCommit}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-black text-black shadow-[0_4px_20px_rgba(251,191,36,0.3)] transition hover:bg-amber-300 disabled:opacity-30 disabled:shadow-none"
                  >
                    <Zap className="h-4 w-4" />
                    Lock In My Mission
                  </button>

                  <button
                    onClick={dismiss}
                    className="relative z-10 mt-2 w-full py-2 text-xs text-slate-600 hover:text-slate-400"
                  >
                    Skip for today
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
