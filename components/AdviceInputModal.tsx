"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import clsx from "clsx";

type Advice = {
  id: string;
  user_id: string;
  text: string;
  is_anonymous: boolean;
  created_at: string;
  upvotes_count: number;
  user_upvoted: boolean;
};

type Props = {
  questionId: string;
  onClose: () => void;
  onSubmit: (advice: Advice) => void;
};

export function AdviceInputModal({ questionId, onClose, onSubmit }: Props) {
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = text.length;
  const minChars = 20;
  const maxChars = 1000;
  const isValid = charCount >= minChars;

  async function handleSubmit() {
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: questionId,
          text: text.trim(),
          is_anonymous: isAnonymous,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to submit advice");
        return;
      }

      const data = await res.json();

      // Construct advice object for callback
      const newAdvice: Advice = {
        id: data.advice.id,
        user_id: "", // Will be current user
        text: text.trim(),
        is_anonymous: isAnonymous,
        created_at: data.advice.created_at,
        upvotes_count: 0,
        user_upvoted: false,
      };

      onSubmit(newAdvice);
    } catch (err) {
      console.error("Error submitting advice:", err);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[140] mx-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col rounded-t-3xl border-t border-white/10 bg-black"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Share your advice</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <X className="h-4 w-4 text-white/70" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </motion.div>
            )}

            {/* Text input */}
            <div>
              <label className="text-xs font-semibold text-white/70 block mb-2">
                Your advice (20–1000 characters)
              </label>
              <textarea
                value={text}
                onChange={(e) => {
                  if (e.target.value.length <= maxChars) {
                    setText(e.target.value);
                  }
                }}
                placeholder="Share your helpful advice..."
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition resize-none"
                rows={5}
              />
              <p
                className={clsx(
                  "text-xs mt-1.5 transition",
                  charCount < minChars
                    ? "text-white/40"
                    : charCount > maxChars * 0.9
                      ? "text-orange-400"
                      : "text-white/50"
                )}
              >
                {charCount} / {maxChars}
              </p>
            </div>

            {/* Anonymous toggle */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10">
              <label className="flex items-center flex-1 gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <span className="text-xs font-medium text-white">Keep my advice anonymous</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 bg-black/40 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] backdrop-blur-md">
            <button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className={clsx(
                "w-full py-2.5 rounded-lg font-semibold text-sm transition",
                isValid && !submitting
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
                  : "bg-white/5 text-white/40 cursor-not-allowed"
              )}
            >
              {submitting ? "Submitting..." : "Post Advice"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
