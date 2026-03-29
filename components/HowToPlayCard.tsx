"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, PenLine, Trophy, Repeat, ChevronDown, ChevronUp } from "lucide-react";

const STEPS = [
  { icon: Flame, text: "A new challenge drops every day", color: "text-orange-400" },
  { icon: PenLine, text: "Complete it and log what you did", color: "text-sky-400" },
  { icon: Trophy, text: "Earn badges as you stack completions", color: "text-amber-400" },
  { icon: Repeat, text: "Build your streak — never break the chain", color: "text-emerald-400" },
];

type CardState = "expanded" | "collapsed" | "dismissed";

export function HowToPlayCard() {
  const [state, setState] = useState<CardState | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("liftly-challenge-howto");
    if (stored === "dismissed") setState("dismissed");
    else if (stored === "collapsed") setState("collapsed");
    else if (stored === "1") setState("dismissed"); // legacy dismiss value
    else setState("expanded");
  }, []);

  if (state === null || state === "dismissed") return null;

  function collapse() {
    setState("collapsed");
    localStorage.setItem("liftly-challenge-howto", "collapsed");
  }

  function expand() {
    setState("expanded");
    localStorage.setItem("liftly-challenge-howto", "expanded");
  }

  function dismiss() {
    setState("dismissed");
    localStorage.setItem("liftly-challenge-howto", "dismissed");
  }

  return (
    <div
      className="rounded-2xl backdrop-blur-sm overflow-hidden"
      style={{
        backgroundColor: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={state === "expanded" ? collapse : expand}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <p className="text-xs font-bold uppercase tracking-widest dark:text-sky-300 text-sky-600">
          How to Play
        </p>
        <div className="flex items-center gap-1.5">
          {state === "expanded" ? (
            <ChevronUp className="h-4 w-4" style={{ color: "var(--muted)" }} />
          ) : (
            <ChevronDown className="h-4 w-4" style={{ color: "var(--muted)" }} />
          )}
          <button
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            className="rounded-full p-0.5 transition"
            style={{ color: "var(--muted)" }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </button>

      {/* Steps — animated expand/collapse */}
      <AnimatePresence initial={false}>
        {state === "expanded" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 px-4 pb-4">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: "var(--glass-bg)" }}
                  >
                    <step.icon className={`h-3.5 w-3.5 ${step.color}`} />
                  </div>
                  <p className="text-sm text-foreground/80">{step.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
