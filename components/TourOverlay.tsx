"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles } from "lucide-react";

const TOUR_STEPS = [
  {
    title: "Your Feed",
    description: "Swipe through reels for daily inspiration on mindset, fitness, books, and more.",
    icon: "📱",
    highlight: "Feed",
  },
  {
    title: "Explore & Search",
    description: "Discover new reels, creators, and categories. Follow people who inspire you.",
    icon: "🔍",
    highlight: "Search",
  },
  {
    title: "Create Reels",
    description: "Share your own wisdom. Pick a category, add content, choose audio and backgrounds.",
    icon: "✨",
    highlight: "Create",
  },
  {
    title: "Daily Challenges",
    description: "Complete challenges to earn badges and climb the leaderboard. Build your streak!",
    icon: "🎯",
    highlight: "Challenge",
  },
  {
    title: "Your Profile",
    description: "Track your vibe score, streak, followers, and invite friends with your codes.",
    icon: "👤",
    highlight: "Profile",
  },
];

export function TourOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem("liftly-tour-complete");
    if (!completed) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleNext() {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      completeTour();
    }
  }

  function completeTour() {
    localStorage.setItem("liftly-tour-complete", "1");
    setVisible(false);
    // Reward +5 vibe for completing tour
    fetch("/api/streak", { method: "POST" }).catch(() => null);
  }

  function skip() {
    localStorage.setItem("liftly-tour-complete", "1");
    setVisible(false);
  }

  const current = TOUR_STEPS[step];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md px-6"
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950/90 p-6 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
          >
            {/* Skip button */}
            <div className="flex justify-end mb-2">
              <button
                onClick={skip}
                className="text-xs text-slate-500 hover:text-white transition flex items-center gap-1"
              >
                Skip tour <X className="h-3 w-3" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex justify-center gap-1.5 mb-6">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i === step ? "w-6 bg-sky-400" : i < step ? "w-3 bg-sky-400/40" : "w-3 bg-white/10"
                  }`}
                />
              ))}
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-purple-500/20 border border-white/10">
                <span className="text-4xl">{current.icon}</span>
              </div>
            </div>

            {/* Content */}
            <h2 className="text-center text-xl font-bold text-white mb-2">
              {current.title}
            </h2>
            <p className="text-center text-sm text-slate-400 leading-relaxed mb-6">
              {current.description}
            </p>

            {/* Navigation */}
            <button
              onClick={handleNext}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(56,189,248,0.25)] transition hover:brightness-110"
            >
              {step < TOUR_STEPS.length - 1 ? (
                <>Next <ArrowRight className="h-4 w-4" /></>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Complete Tour (+5 Vibe)
                </>
              )}
            </button>

            {/* Step count */}
            <p className="mt-3 text-center text-[11px] text-slate-600">
              Step {step + 1} of {TOUR_STEPS.length}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
