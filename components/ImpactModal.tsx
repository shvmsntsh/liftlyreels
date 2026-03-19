"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X } from "lucide-react";

type Props = {
  postTitle: string;
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onLogged: () => void;
};

export function ImpactModal({ postTitle, postId, isOpen, onClose, onLogged }: Props) {
  const [action, setAction] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleLog() {
    if (!action.trim() || saving) return;
    setSaving(true);
    try {
      await fetch("/api/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, actionTaken: action.trim() }),
      });
      onLogged();
      setAction("");
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
            className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md rounded-3xl border border-amber-400/20 bg-gradient-to-b from-amber-950/90 to-slate-950/90 p-5 backdrop-blur-xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
                <Zap className="h-4 w-4 fill-current" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                  Log Your Impact
                </p>
                <p className="text-[11px] text-slate-400 line-clamp-1">{postTitle}</p>
              </div>
            </div>

            <p className="mb-3 text-sm text-slate-300">
              What action did this reel spark in you?
            </p>

            <textarea
              value={action}
              onChange={(e) => setAction(e.target.value.slice(0, 140))}
              placeholder="e.g. I woke up 30 mins earlier and hit the gym..."
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-400/40"
            />
            <div className="mb-3 text-right text-[10px] text-slate-600">{action.length}/140</div>

            <button
              onClick={handleLog}
              disabled={!action.trim() || saving}
              className="w-full rounded-xl bg-amber-400 py-2.5 text-sm font-bold text-amber-950 transition hover:bg-amber-300 disabled:opacity-40"
            >
              {saving ? "Logging..." : "Log Impact +3 Vibe"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
