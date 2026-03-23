"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Trophy, TrendingUp } from "lucide-react";
import { getStreakRank, getNextStreakRank, STREAK_RANKS } from "@/lib/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  longestStreak: number;
  lastActive: string | null;
};

export function StreakSheet({ isOpen, onClose, currentStreak, longestStreak, lastActive }: Props) {
  const rank = getStreakRank(currentStreak);
  const nextRank = getNextStreakRank(currentStreak);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl backdrop-blur-xl"
            style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-400" />
                Streak Details
              </h3>
              <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-5">
              {/* Current rank */}
              <div className="text-center">
                <span className="text-5xl">{rank.icon}</span>
                <p className="mt-2 text-lg font-bold" style={{ color: rank.color }}>{rank.name}</p>
                <p className="text-sm text-slate-500">Current Rank</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <Flame className="mx-auto mb-1 h-4 w-4 text-orange-400" />
                  <p className="text-xl font-bold text-orange-300">{currentStreak}</p>
                  <p className="text-[10px] text-slate-500">Current Streak</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <Trophy className="mx-auto mb-1 h-4 w-4 text-amber-400" />
                  <p className="text-xl font-bold text-amber-300">{longestStreak}</p>
                  <p className="text-[10px] text-slate-500">Longest Streak</p>
                </div>
              </div>

              {lastActive && (
                <p className="text-center text-xs text-slate-500">
                  Last active: {new Date(lastActive).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </p>
              )}

              {/* Progress to next rank */}
              {nextRank && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-slate-400">Next rank: {nextRank.icon} {nextRank.name}</p>
                    <p className="text-xs text-slate-500">{currentStreak}/{nextRank.min} days</p>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((currentStreak / nextRank.min) * 100, 100)}%`,
                        backgroundColor: nextRank.color,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* All ranks */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3" /> All Ranks
                </p>
                <div className="space-y-2">
                  {STREAK_RANKS.map((r) => (
                    <div
                      key={r.name}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                        currentStreak >= r.min ? "bg-white/5" : "opacity-40"
                      }`}
                    >
                      <span className="text-lg">{r.icon}</span>
                      <span className="text-sm font-semibold" style={{ color: r.color }}>{r.name}</span>
                      <span className="ml-auto text-xs text-slate-500">{r.min}+ days</span>
                      {currentStreak >= r.min && (
                        <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
