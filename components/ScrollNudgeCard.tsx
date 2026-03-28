"use client";

import { motion } from "framer-motion";
import { Flame, CheckCircle, ArrowUp } from "lucide-react";

type Props = {
  count: number;
  actionsLogged?: number;
  onScrollBack?: () => void;
};

export function ScrollNudgeCard({ count, actionsLogged = 0, onScrollBack }: Props) {
  const hasLogged = actionsLogged > 0;

  return (
    <div className="snap-start flex h-screen flex-col items-center justify-center px-8"
      style={{ background: hasLogged
        ? "linear-gradient(160deg, #052e16 0%, #0f172a 100%)"
        : "linear-gradient(160deg, #1c0a00 0%, #0f172a 100%)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring" as const, damping: 20, stiffness: 300 }}
        className="flex flex-col items-center text-center"
      >
        <motion.div
          className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            hasLogged ? "bg-emerald-500/15" : "bg-amber-500/12"
          }`}
          animate={hasLogged ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {hasLogged
            ? <Flame className="h-8 w-8 text-emerald-400" />
            : <Flame className="h-8 w-8 text-amber-400" />
          }
        </motion.div>

        {hasLogged ? (
          <>
            <div className="mb-3 flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-4 py-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-300">
                {actionsLogged} action{actionsLogged > 1 ? "s" : ""} logged!
              </span>
            </div>
            <h3 className="text-2xl font-black text-white">
              You&apos;re proving it.
            </h3>
            <p className="mt-2 text-base text-slate-400">
              {count} reels deep.
            </p>
            <p className="mt-5 max-w-[260px] text-sm leading-relaxed text-slate-500">
              Consistency beats intensity. Keep watching, keep proving.
              Every action builds your streak.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-black text-white">
              {count} reels watched.
            </h3>
            <p className="mt-2 text-base text-slate-400">
              No actions logged yet.
            </p>
            <p className="mt-5 max-w-[260px] text-sm leading-relaxed text-slate-500">
              Watching feels productive — but it&apos;s not.
              Go back and tap{" "}
              <span className="font-bold text-emerald-400">&ldquo;I Did This&rdquo;</span>{" "}
              on something you actually did or can do right now.
            </p>
          </>
        )}

        {onScrollBack && !hasLogged && (
          <button
            onClick={onScrollBack}
            className="mt-8 flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition active:scale-[0.97]"
          >
            <ArrowUp className="h-4 w-4" />
            Go prove it
          </button>
        )}

        {hasLogged && (
          <p className="mt-8 text-[11px] font-medium text-slate-600">
            Keep scrolling — your streak is building 🔥
          </p>
        )}

        {!hasLogged && (
          <p className="mt-4 text-[10px] text-slate-700">
            or keep scrolling… but we both know that&apos;s not why you&apos;re here
          </p>
        )}
      </motion.div>
    </div>
  );
}
