"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getStreakRank } from "@/lib/types";

const MILESTONES = [3, 7, 14, 30, 60, 100, 365];

export function isMilestone(streak: number) {
  return MILESTONES.includes(streak);
}

type Props = {
  streak: number;
  show: boolean;
  onDone: () => void;
};

export function StreakCelebration({ streak, show, onDone }: Props) {
  const rank = getStreakRank(streak);

  useEffect(() => {
    if (show) {
      const t = setTimeout(onDone, 3000);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Radial burst */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(251,191,36,0.15), transparent)",
            }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />

          <motion.div
            className="flex flex-col items-center text-center px-8"
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 18, stiffness: 280 }}
          >
            <motion.div
              className="text-7xl mb-2"
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1.2, 1.2, 1.2, 1] }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {rank.icon}
            </motion.div>
            <motion.p
              className="text-3xl font-black text-white mb-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {streak}-Day Streak!
            </motion.p>
            <motion.p
              className="text-base font-bold mb-1"
              style={{ color: rank.color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              {rank.name} Unlocked
            </motion.p>
            <motion.p
              className="text-sm text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Keep proving it every day.
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
