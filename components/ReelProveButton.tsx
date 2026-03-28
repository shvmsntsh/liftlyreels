"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

type Props = {
  postId: string;
  proofCount: number;
  isLoggedIn: boolean;
};

export function ReelProveButton({ postId, proofCount, isLoggedIn }: Props) {
  const [status, setStatus] = useState<"idle" | "logging" | "done" | "error">("idle");

  async function handleProve() {
    if (!isLoggedIn || status !== "idle") return;
    setStatus("logging");
    try {
      const res = await fetch("/api/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, actionTaken: "Proved from share link" }),
      });
      if (res.ok) {
        setStatus("done");
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2500);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
  }

  const label =
    proofCount > 0
      ? `Join ${proofCount} ${proofCount === 1 ? "person" : "people"} who actually did this →`
      : "Be the first to prove you did this →";

  if (!isLoggedIn) {
    return (
      <div className="w-full space-y-3">
        <Link
          href="/signup"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-base font-black text-white shadow-[0_4px_24px_rgba(16,185,129,0.4)] transition hover:bg-emerald-400"
        >
          {label}
        </Link>
        <Link
          href="/login"
          className="block w-full py-3 text-center text-sm font-semibold text-white/50 hover:text-white/80 transition"
        >
          Already have an account? Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {status === "done" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/15 py-4 text-base font-black text-white"
          >
            <Check className="h-5 w-5 text-emerald-400" strokeWidth={2.5} />
            Proof logged!
          </motion.div>
        ) : (
          <motion.button
            key="btn"
            onClick={handleProve}
            disabled={status === "logging"}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-base font-black text-white shadow-[0_4px_24px_rgba(16,185,129,0.4)] transition hover:bg-emerald-400 disabled:opacity-60"
            whileTap={{ scale: 0.97 }}
          >
            {status === "logging" ? (
              <span className="flex items-center gap-2">
                <motion.span
                  className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.65, repeat: Infinity, ease: "linear" }}
                />
                Logging...
              </span>
            ) : (
              "I Did This ✓"
            )}
          </motion.button>
        )}
      </AnimatePresence>
      {status === "error" && (
        <p className="mt-2 text-center text-xs text-red-300">Something went wrong. Try again.</p>
      )}
    </div>
  );
}
