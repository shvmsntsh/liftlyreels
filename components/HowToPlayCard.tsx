"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, PenLine, Trophy, Repeat } from "lucide-react";

const STEPS = [
  { icon: Flame, text: "A new challenge drops every day", color: "text-orange-400" },
  { icon: PenLine, text: "Complete it and log what you did", color: "text-sky-400" },
  { icon: Trophy, text: "Earn badges as you stack completions", color: "text-amber-400" },
  { icon: Repeat, text: "Build your streak — never break the chain", color: "text-emerald-400" },
];

export function HowToPlayCard() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("liftly-challenge-howto");
    if (!dismissed) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem("liftly-challenge-howto", "1");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12, height: 0, marginBottom: 0 }}
          className="rounded-2xl border border-sky-400/20 bg-sky-950/40 p-4 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-300">
              How to Play
            </p>
            <button
              onClick={dismiss}
              className="rounded-full p-1 text-muted hover:text-foreground transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2.5">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5">
                  <step.icon className={`h-3.5 w-3.5 ${step.color}`} />
                </div>
                <p className="text-sm text-slate-300">{step.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
