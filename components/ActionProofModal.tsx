"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X } from "lucide-react";
import { ACTION_TEMPLATES } from "@/lib/types";

type Props = {
  postTitle: string;
  postId: string;
  category: string;
  isOpen: boolean;
  onClose: () => void;
  onLogged: () => void;
};

export function ActionProofModal({ postTitle, postId, category, isOpen, onClose, onLogged }: Props) {
  const [action, setAction] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templates = ACTION_TEMPLATES[category] ?? ACTION_TEMPLATES.Mindset;

  async function handleLog() {
    if (!action.trim() || saving) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, actionTaken: action.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Failed to log action. Please try again.");
        return;
      }

      onLogged();
      setAction("");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-md overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/90 to-slate-950/95 backdrop-blur-xl"
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 24 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
          >
            <div className="p-5">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 text-slate-400 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header */}
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-300">
                    I Did This
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{postTitle}</p>
                </div>
              </div>

              {/* Quick templates */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {templates.map((t) => (
                  <button
                    key={t}
                    onClick={() => setAction(t)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                      action === t
                        ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Text input */}
              <textarea
                value={action}
                onChange={(e) => setAction(e.target.value.slice(0, 140))}
                placeholder="What did you do? Be specific..."
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-[var(--input-bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-emerald-400/40"
              />
              <div className="mb-3 text-right text-[10px] text-slate-600">{action.length}/140</div>

              {error && (
                <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                onClick={handleLog}
                disabled={!action.trim() || saving}
                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(16,185,129,0.3)] transition hover:bg-emerald-400 disabled:opacity-40 disabled:shadow-none"
              >
                {saving ? "Logging..." : "I Did This +3 Vibe"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
