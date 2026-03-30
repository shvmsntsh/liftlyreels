"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { QuestionsDetailModal } from "./QuestionsDetailModal";

type Question = {
  id: string;
  title: string;
  category: string;
  author_id: string | null;
  is_anonymous: boolean;
  created_at: string;
  advice_count: number;
};

const CATEGORIES = [
  "Mindset",
  "Gym",
  "Diet",
  "Books",
  "Wellness",
  "Finance",
  "Relationships",
];

export function QuestionsTab() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "trending">("newest");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);

  async function fetchQuestions(newOffset: number = 0) {
    if (loading) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        limit: "20",
        offset: String(newOffset),
        sort,
      });

      if (selectedCategory) {
        params.append("category", selectedCategory);
      }

      const res = await fetch(`/api/questions?${params}`);
      const data = await res.json();

      if (newOffset === 0) {
        setQuestions(data.questions ?? []);
      } else {
        setQuestions((prev) => [...prev, ...(data.questions ?? [])]);
      }

      setHasMore((data.questions ?? []).length === 20);
      setOffset(newOffset + 20);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  // Fetch on mount and when filters change
  useEffect(() => {
    setOffset(0);
    fetchQuestions(0);
  }, [selectedCategory, sort]);

  function handleLoadMore() {
    if (!loading && hasMore) {
      fetchQuestions(offset);
    }
  }

  return (
    <div className="mx-auto max-w-md min-h-screen pb-28">
      {/* Category filter */}
      <div className="sticky top-24 z-20 px-4 py-3 bg-black/40 backdrop-blur-md border-b border-white/5">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <button
              onClick={() => setCategoryOpen(!categoryOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white/70 hover:text-white transition"
            >
              <span>{selectedCategory ?? "All Categories"}</span>
              <ChevronDown
                className={clsx("h-4 w-4 transition", categoryOpen && "rotate-180")}
              />
            </button>

            {categoryOpen && (
              <div className="absolute top-10 left-0 right-0 bg-black border border-white/10 rounded-lg py-1 z-30">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setCategoryOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-white/70 hover:bg-white/5 transition"
                >
                  All Categories
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCategoryOpen(false);
                    }}
                    className={clsx(
                      "w-full px-3 py-2 text-left text-sm transition",
                      selectedCategory === cat
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/5"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort buttons */}
          <div className="flex gap-1">
            {(["newest", "trending"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={clsx(
                  "px-2 py-1.5 text-xs font-bold rounded-lg transition",
                  sort === s
                    ? "bg-white/15 text-white"
                    : "bg-white/5 text-white/50 hover:text-white/70"
                )}
              >
                {s === "newest" ? "New" : "Hot"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-3 px-4 py-4">
        {questions.length === 0 && !loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-lg font-semibold text-white">No questions yet</p>
              <p className="mt-2 text-sm text-white/50">
                Be the first to ask something!
              </p>
            </div>
          </div>
        ) : (
          <>
            {questions.map((question) => (
              <motion.button
                key={question.id}
                onClick={() => setSelectedQuestion(question)}
                className="w-full text-left p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/8 transition"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white line-clamp-2">
                      {question.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/70">
                        {question.category}
                      </span>
                      <span className="text-xs text-white/50">
                        {question.advice_count} {question.advice_count === 1 ? "answer" : "answers"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}

            {loading && (
              <div className="flex items-center justify-center py-6">
                <motion.div
                  className="h-6 w-6 rounded-full border-2 border-white/40 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              </div>
            )}

            {hasMore && !loading && (
              <button
                onClick={handleLoadMore}
                className="w-full py-3 rounded-lg border border-white/10 text-white/70 hover:text-white text-sm font-semibold transition hover:bg-white/5"
              >
                Load More
              </button>
            )}
          </>
        )}
      </div>

      {/* Question detail modal */}
      {selectedQuestion && (
        <QuestionsDetailModal
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
        />
      )}
    </div>
  );
}
