"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, X, Flame, Check, ChevronRight } from "lucide-react";

type Chain = {
  goal: string;
  target: number;
  startDate: string; // ISO date string
  completedDates: string[]; // ISO date strings
};

const CHAIN_OPTIONS = [
  { days: 7, label: "7-Day Sprint", desc: "Build the habit", emoji: "⚡" },
  { days: 30, label: "30-Day Challenge", desc: "Lock it in", emoji: "🔥" },
  { days: 75, label: "75 Hard", desc: "Transform", emoji: "💎" },
];

const GOALS = [
  "Complete the daily challenge every day",
  "Work out every day",
  "Eat clean every day",
  "Meditate every day",
  "Read every day",
  "No social media scrolling",
  "Cold shower every morning",
  "Journal every night",
];

const STORAGE_KEY = "liftly-commitment-chain";

function loadChain(): Chain | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveChain(chain: Chain) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chain));
}

function getDaysSinceStart(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
}

function isChainBroken(chain: Chain): boolean {
  // Check if yesterday was completed (allow today to still be done)
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const daysSince = getDaysSinceStart(chain.startDate);
  if (daysSince <= 1) return false; // Just started
  const completedSet = new Set(chain.completedDates);
  return !completedSet.has(yesterday) && !completedSet.has(today);
}

export function CommitmentChain() {
  const [chain, setChain] = useState<Chain | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedGoal, setSelectedGoal] = useState(GOALS[0]);
  const [customGoal, setCustomGoal] = useState("");

  useEffect(() => {
    setChain(loadChain());
  }, []);

  function startChain() {
    const goal = customGoal.trim() || selectedGoal;
    const newChain: Chain = {
      goal,
      target: selectedDays,
      startDate: new Date().toISOString().slice(0, 10),
      completedDates: [],
    };
    saveChain(newChain);
    setChain(newChain);
    setShowSetup(false);
  }

  function markToday() {
    if (!chain) return;
    const today = new Date().toISOString().slice(0, 10);
    if (chain.completedDates.includes(today)) return;
    const updated = { ...chain, completedDates: [...chain.completedDates, today] };
    saveChain(updated);
    setChain(updated);
  }

  function abandonChain() {
    localStorage.removeItem(STORAGE_KEY);
    setChain(null);
  }

  if (!chain && !showSetup) {
    return (
      <button
        onClick={() => setShowSetup(true)}
        className="flex w-full items-center justify-between rounded-2xl border border-violet-400/20 bg-violet-950/20 px-4 py-3 text-left transition hover:bg-violet-950/30"
      >
        <div className="flex items-center gap-3">
          <Target className="h-4 w-4 text-violet-400" />
          <div>
            <p className="text-sm font-bold text-foreground">Start a Commitment Chain</p>
            <p className="text-[11px] text-slate-500">7, 30, or 75 days — no breaks allowed</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-600" />
      </button>
    );
  }

  if (showSetup) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-violet-400/20 bg-violet-950/20 p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-foreground">Choose Your Chain</p>
          <button onClick={() => setShowSetup(false)}><X className="h-4 w-4 text-slate-500" /></button>
        </div>

        {/* Duration picker */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {CHAIN_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setSelectedDays(opt.days)}
              className={`rounded-xl border p-2.5 text-center transition ${
                selectedDays === opt.days
                  ? "border-violet-400/40 bg-violet-400/15"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="text-xl mb-0.5">{opt.emoji}</div>
              <div className="text-xs font-bold text-foreground">{opt.label}</div>
              <div className="text-[10px] text-slate-500">{opt.desc}</div>
            </button>
          ))}
        </div>

        {/* Goal picker */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {GOALS.map((g) => (
            <button
              key={g}
              onClick={() => { setSelectedGoal(g); setCustomGoal(""); }}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                selectedGoal === g && !customGoal
                  ? "border-violet-400/40 bg-violet-400/15 text-violet-300"
                  : "border-white/10 bg-white/5 text-slate-400"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={customGoal}
          onChange={(e) => { setCustomGoal(e.target.value.slice(0, 60)); setSelectedGoal(""); }}
          placeholder="Or write your own goal..."
          className="mb-3 w-full rounded-xl border border-white/10 bg-[var(--input-bg)] px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-violet-400/40"
        />

        <button
          onClick={startChain}
          className="w-full rounded-xl bg-violet-500 py-3 text-sm font-bold text-white transition hover:bg-violet-400"
        >
          Lock In My {selectedDays}-Day Chain
        </button>
      </motion.div>
    );
  }

  if (!chain) return null;

  const today = new Date().toISOString().slice(0, 10);
  const doneToday = chain.completedDates.includes(today);
  const daysSince = getDaysSinceStart(chain.startDate);
  const completedCount = chain.completedDates.length;
  const broken = isChainBroken(chain);
  const progress = Math.min((completedCount / chain.target) * 100, 100);
  const finished = completedCount >= chain.target;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${
        broken
          ? "border-red-400/20 bg-red-950/20"
          : finished
          ? "border-emerald-400/20 bg-emerald-950/20"
          : "border-violet-400/20 bg-violet-950/20"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{finished ? "🏆" : broken ? "💔" : "🔗"}</span>
          <div>
            <p className="text-sm font-bold text-foreground">
              {finished ? "Chain Complete!" : broken ? "Chain Broken" : `Day ${daysSince} of ${chain.target}`}
            </p>
            <p className="text-[11px] text-slate-500 line-clamp-1">{chain.goal}</p>
          </div>
        </div>
        <button onClick={abandonChain} className="text-slate-600 hover:text-slate-400">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span>{completedCount} done</span>
          <span>{chain.target - completedCount} left</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${finished ? "bg-emerald-400" : broken ? "bg-red-400" : "bg-violet-400"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {!finished && !broken && (
        <button
          onClick={markToday}
          disabled={doneToday}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
            doneToday
              ? "bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 cursor-default"
              : "bg-violet-500 text-white hover:bg-violet-400"
          }`}
        >
          {doneToday ? (
            <><Check className="h-4 w-4" /> Done for today!</>
          ) : (
            <><Flame className="h-4 w-4" /> Mark Today Done</>
          )}
        </button>
      )}

      {broken && (
        <button
          onClick={() => { abandonChain(); setShowSetup(true); }}
          className="w-full rounded-xl border border-violet-400/30 py-2.5 text-sm font-bold text-violet-300 transition hover:bg-violet-950/40"
        >
          Start Fresh
        </button>
      )}

      {finished && (
        <div className="text-center text-sm font-bold text-emerald-400">
          🎉 {chain.target} days complete. You proved it.
        </div>
      )}
    </motion.div>
  );
}
