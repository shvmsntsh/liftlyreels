"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ThumbsUp } from "lucide-react";
import clsx from "clsx";
import { AdviceInputModal } from "./AdviceInputModal";

type Question = {
  id: string;
  title: string;
  category: string;
  author_id: string | null;
  is_anonymous: boolean;
  created_at: string;
  advice_count: number;
};

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
  question: Question;
  onClose: () => void;
};

export function QuestionsDetailModal({ question, onClose }: Props) {
  const [advice, setAdvice] = useState<Advice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdviceInput, setShowAdviceInput] = useState(false);

  useEffect(() => {
    async function fetchAdvice() {
      try {
        const res = await fetch(`/api/questions/${question.id}`);
        const data = await res.json();
        setAdvice(data.advice ?? []);
      } catch (err) {
        console.error("Error fetching advice:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAdvice();
  }, [question.id]);

  async function handleUpvote(adviceId: string) {
    try {
      const res = await fetch(`/api/advice/${adviceId}/upvote`, {
        method: "POST",
      });
      const data = await res.json();

      setAdvice((prev) =>
        prev.map((a) =>
          a.id === adviceId
            ? {
                ...a,
                upvotes_count: data.upvotes_count,
                user_upvoted: data.user_upvoted,
              }
            : a
        )
      );
    } catch (err) {
      console.error("Error upvoting advice:", err);
    }
  }

  async function handleAdviceSubmitted(newAdvice: Advice) {
    setAdvice((prev) => [newAdvice, ...prev]);
    setShowAdviceInput(false);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[125] mx-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col rounded-t-3xl border-t border-white/10 bg-black"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md rounded-t-3xl">
            <h2 className="text-sm font-semibold text-white flex-1 line-clamp-1">
              {question.title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <X className="h-4 w-4 text-white/70" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
            {/* Question info */}
            <div className="pb-3 border-b border-white/5">
              <span className="inline-block text-xs px-2 py-1 rounded bg-white/10 text-white/70">
                {question.category}
              </span>
            </div>

            {/* Advice list */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <motion.div
                  className="h-6 w-6 rounded-full border-2 border-white/40 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : advice.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-white/50">No advice yet</p>
                <p className="text-xs text-white/30 mt-1">Be the first to help!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {advice.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg border border-white/10 bg-white/5"
                  >
                    <p className="text-xs text-white/50 mb-2">
                      {item.is_anonymous
                        ? "Anonymous"
                        : `User`}
                    </p>
                    <p className="text-sm text-white leading-relaxed">
                      {item.text}
                    </p>
                    <button
                      onClick={() => handleUpvote(item.id)}
                      className={clsx(
                        "mt-2 flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg transition",
                        item.user_upvoted
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-white/5 text-white/50 hover:text-white/70"
                      )}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      <span>{item.upvotes_count}</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="sticky bottom-0 border-t border-white/10 bg-black/40 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] backdrop-blur-md">
            <button
              onClick={() => setShowAdviceInput(true)}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm transition hover:opacity-90"
            >
              Give Advice
            </button>
          </div>

          {/* Advice input modal */}
          {showAdviceInput && (
            <AdviceInputModal
              questionId={question.id}
              onClose={() => setShowAdviceInput(false)}
              onSubmit={handleAdviceSubmitted}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
