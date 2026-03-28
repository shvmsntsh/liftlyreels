"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowUp } from "lucide-react";

type Props = {
  count: number;
  onScrollBack?: () => void;
};

export function ScrollNudgeCard({ count, onScrollBack }: Props) {
  return (
    <div className="snap-start flex h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-emerald-950/30 px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="flex flex-col items-center text-center"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h3 className="text-2xl font-black text-white">
          {count} reels watched.
        </h3>
        <p className="mt-2 text-base text-slate-400">
          Zero actions taken.
        </p>

        <p className="mt-6 max-w-[260px] text-sm leading-relaxed text-slate-500">
          Scrolling feels productive but it&apos;s not. Go back and tap{" "}
          <span className="font-bold text-emerald-400">&quot;I Did This&quot;</span>{" "}
          on something you actually did.
        </p>

        {onScrollBack && (
          <button
            onClick={onScrollBack}
            className="mt-8 flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition active:scale-[0.97]"
          >
            <ArrowUp className="h-4 w-4" />
            Go prove it
          </button>
        )}

        <p className="mt-4 text-[10px] text-slate-600">
          or keep scrolling... but we both know that&apos;s not why you&apos;re here
        </p>
      </motion.div>
    </div>
  );
}
