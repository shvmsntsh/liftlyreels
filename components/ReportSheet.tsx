"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag, Check } from "lucide-react";

const REASONS = [
  "Spam or misleading",
  "Inappropriate content",
  "Misinformation",
  "Hateful or offensive",
  "Violates community guidelines",
  "Other",
];

type Props = {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
};

export function ReportSheet({ postId, isOpen, onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!selected || submitting) return;
    setSubmitting(true);
    await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, reason: selected }),
    }).catch(() => null);
    setDone(true);
    setSubmitting(false);
    setTimeout(onClose, 1500);
  }

  function handleClose() {
    setSelected(null);
    setDone(false);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[105] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[110] mx-auto max-w-md rounded-t-3xl"
            style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Flag className="h-4 w-4 text-red-400" />
                Report Content
              </h3>
              <button onClick={handleClose} className="rounded-full p-1.5 text-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-2 pb-safe">
              {done ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8 text-center"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
                    <Check className="h-6 w-6" />
                  </div>
                  <p className="text-base font-bold text-foreground">Report submitted</p>
                  <p className="mt-1 text-sm text-slate-500">Thanks for keeping Liftly safe.</p>
                </motion.div>
              ) : (
                <>
                  <p className="text-sm text-slate-500 mb-3">Why are you reporting this?</p>
                  {REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setSelected(reason)}
                      className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${
                        selected === reason
                          ? "border border-red-400/30 bg-red-950/20 text-foreground font-medium"
                          : "border border-white/8 bg-white/3 text-slate-300 hover:bg-white/6"
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                  <button
                    onClick={handleSubmit}
                    disabled={!selected || submitting}
                    className="mt-2 w-full rounded-xl bg-red-500 py-3 text-sm font-bold text-white transition hover:bg-red-400 disabled:opacity-40"
                  >
                    {submitting ? "Submitting..." : "Submit Report"}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
