"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import clsx from "clsx";

const CATEGORIES = [
  "Mindset",
  "Gym",
  "Diet",
  "Books",
  "Wellness",
  "Finance",
  "Relationships",
];

type Question = {
  id: string;
  title: string;
  category: string;
  author_id: string | null;
  is_anonymous: boolean;
  created_at: string;
  advice_count: number;
};

type Props = {
  onClose: () => void;
  onSubmit: (question: Question) => void;
};

export function AskQuestionModal({ onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Gym");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = title.length;
  const minChars = 10;
  const maxChars = 200;
  const isValid = charCount >= minChars;

  async function handleSubmit() {
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          is_anonymous: isAnonymous,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create question");
        return;
      }

      const data = await res.json();

      // Construct question object for callback
      const newQuestion: Question = {
        id: data.question.id,
        title: data.question.title,
        category: data.question.category,
        author_id: null,
        is_anonymous: isAnonymous,
        created_at: data.question.created_at,
        advice_count: 0,
      };

      onSubmit(newQuestion);
    } catch (err) {
      console.error("Error creating question:", err);
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md bg-black border-t border-white/10 rounded-t-3xl flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Ask a question</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <X className="h-4 w-4 text-white/70" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
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

            {/* Title input */}
            <div>
              <label className="text-xs font-semibold text-white/70 block mb-2">
                Your question (10–200 characters)
              </label>
              <textarea
                value={title}
                onChange={(e) => {
                  if (e.target.value.length <= maxChars) {
                    setTitle(e.target.value);
                  }
                }}
                placeholder="What's your biggest gym challenge?"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition resize-none"
                rows={3}
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

            {/* Category select */}
            <div>
              <label className="text-xs font-semibold text-white/70 block mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
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
                <span className="text-xs font-medium text-white">Keep my question anonymous</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-4 py-3 pb-safe border-t border-white/10 bg-black/40 backdrop-blur-md">
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
              {submitting ? "Posting..." : "Post Question"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
