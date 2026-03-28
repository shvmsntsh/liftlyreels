"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame } from "lucide-react";
import Link from "next/link";

type Props = { streak: number };

export function StreakDefenseBanner({ streak }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (streak <= 0) return;

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const hour = now.getHours();

    // Only show after 4pm
    if (hour < 16) return;

    // Already dismissed today
    if (localStorage.getItem(`liftly-streak-dismissed-${today}`) === "1") return;

    // Already proved today (set by feed when user logs an action)
    if (localStorage.getItem("liftly-streak-date") === today) return;

    setVisible(true);
  }, [streak]);

  function dismiss() {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`liftly-streak-dismissed-${today}`, "1");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 26 }}
          className="relative z-50 mx-4 mt-3 overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/20 to-orange-500/10 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <Flame className="h-5 w-5 shrink-0 text-amber-400" strokeWidth={1.8} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-foreground">
                Your {streak}-day streak is at risk!
              </p>
              <p className="text-[11px] text-muted">
                Take action before midnight to keep it alive.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/feed"
                className="rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-white"
              >
                Act now
              </Link>
              <button onClick={dismiss} className="text-muted hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
