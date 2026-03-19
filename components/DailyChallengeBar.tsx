"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Check, Users } from "lucide-react";
import clsx from "clsx";
import { DailyChallenge } from "@/lib/types";

type Props = {
  challenge: DailyChallenge;
  fullPage?: boolean;
};

export function DailyChallengeBar({ challenge, fullPage }: Props) {
  const [completed, setCompleted] = useState(challenge.user_completed ?? false);
  const [count, setCount] = useState(challenge.completions_count ?? 0);
  const [showInput, setShowInput] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleComplete() {
    if (completed || saving) return;
    if (!note.trim() && showInput) return;

    if (!showInput) {
      setShowInput(true);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: challenge.id, note }),
      });
      const data = await res.json();
      if (data.success || data.alreadyCompleted) {
        setCompleted(true);
        setCount((c) => c + 1);
        setShowInput(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!fullPage) {
    return (
      <div className="mx-4 mt-2 rounded-2xl border border-orange-400/20 bg-orange-950/40 px-4 py-3">
        <div className="flex items-start gap-3">
          <Flame className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-300">
              Today&apos;s Challenge
            </p>
            <p className="mt-0.5 text-sm text-slate-200 line-clamp-2">{challenge.challenge_text}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-orange-300">
            <Users className="h-3 w-3" />
            <span>{count}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(234,88,12,0.15),transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 rounded-3xl border border-orange-400/20 bg-slate-950/70 p-6 backdrop-blur-xl"
      >
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-400/15">
            <Flame className="h-4 w-4 text-orange-400 fill-current" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-300">
              Daily Challenge
            </p>
            <p className="text-[11px] text-slate-500">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        <h2 className="mt-4 text-2xl font-bold leading-snug text-white">
          {challenge.challenge_text}
        </h2>

        <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
          <Users className="h-4 w-4" />
          <span>
            <strong className="text-orange-300">{count}</strong>{" "}
            {count === 1 ? "person has" : "people have"} completed this today
          </span>
        </div>

        <div className="mt-5">
          {completed ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20 px-4 py-3">
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-300">
                You completed today&apos;s challenge!
              </span>
            </div>
          ) : (
            <>
              {showInput && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3"
                >
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 140))}
                    placeholder="Briefly share what you did or plan to do..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-orange-400/40"
                  />
                  <div className="text-right text-[10px] text-slate-600">{note.length}/140</div>
                </motion.div>
              )}
              <button
                onClick={handleComplete}
                disabled={saving || (showInput && !note.trim())}
                className={clsx(
                  "w-full rounded-xl py-3 text-sm font-bold transition",
                  "bg-orange-500 text-white hover:bg-orange-400 disabled:opacity-50"
                )}
              >
                {saving ? "Logging..." : showInput ? "Log My Action" : "I Accept This Challenge"}
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Swipe hint */}
      <div className="mt-6 text-center text-xs text-slate-600">
        Scroll down for your reels
      </div>
    </div>
  );
}
