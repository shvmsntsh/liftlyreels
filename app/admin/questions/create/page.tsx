"use client";

import { useState } from "react";
import { Plus, Loader2, Check, AlertCircle } from "lucide-react";

const CATEGORIES = [
  "Mindset",
  "Gym",
  "Diet",
  "Books",
  "Wellness",
  "Finance",
  "Relationships",
];

type SubmittedQuestion = {
  id: string;
  title: string;
  category: string;
};

export default function AdminQuestionsCreatePage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Gym");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SubmittedQuestion | null>(null);
  const [submitted, setSubmitted] = useState<SubmittedQuestion[]>([]);

  const isValid = title.trim().length >= 10 && title.trim().length <= 200;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          is_anonymous: false,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create question");
        return;
      }

      const data = await res.json();
      const newQuestion: SubmittedQuestion = {
        id: data.question.id,
        title: data.question.title,
        category: data.question.category,
      };

      setSuccess(newQuestion);
      setSubmitted((prev) => [newQuestion, ...prev]);
      setTitle("");
      setCategory("Gym");

      // Clear success after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error creating question:", err);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Create Trending Questions</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Add new questions for users to answer and provide advice on
        </p>
      </div>

      {/* Form */}
      <div
        className="rounded-xl p-4 space-y-4"
        style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title input */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              Question (10–200 characters)
            </label>
            <textarea
              value={title}
              onChange={(e) => {
                if (e.target.value.length <= 200) {
                  setTitle(e.target.value);
                }
              }}
              placeholder="What's your biggest gym challenge?"
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-white/10 text-foreground placeholder:text-white/30 focus:outline-none focus:border-white/30 transition resize-none"
              rows={2}
              style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
            />
            <p
              className={`text-xs mt-1 transition ${
                title.length < 10 ? "opacity-50" : title.length > 180 ? "text-orange-400" : "opacity-50"
              }`}
            >
              {title.length} / 200
            </p>
          </div>

          {/* Category select */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-white/10 text-foreground focus:outline-none focus:border-white/30 transition"
              style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Question
              </>
            )}
          </button>
        </form>
      </div>

      {/* Success message */}
      {success && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-emerald-300">Question created!</p>
            <p className="text-xs text-emerald-300/80 mt-0.5">{success.title}</p>
          </div>
        </div>
      )}

      {/* Submitted questions list */}
      {submitted.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Recently Created ({submitted.length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {submitted.map((q) => (
              <div
                key={q.id}
                className="rounded-lg p-3"
                style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}
              >
                <p className="text-sm text-foreground line-clamp-2">{q.title}</p>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  {q.category}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
