"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Flame, BookOpen, Dumbbell, Brain, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const features = [
  {
    icon: Zap,
    color: "text-amber-300",
    bg: "bg-amber-400/10 border-amber-400/20",
    title: "Spark Reactions",
    desc: "⚡ Sparked, 🔥 Fired Up, 🔖 Saved — react meaningfully, not just with likes.",
  },
  {
    icon: Flame,
    color: "text-orange-300",
    bg: "bg-orange-400/10 border-orange-400/20",
    title: "Daily Streak",
    desc: "Build an unbreakable habit. Your streak grows every day you show up.",
  },
  {
    icon: Brain,
    color: "text-violet-300",
    bg: "bg-violet-400/10 border-violet-400/20",
    title: "Impact Journal",
    desc: "Log real actions you took after a reel. Track your actual growth.",
  },
  {
    icon: BookOpen,
    color: "text-sky-300",
    bg: "bg-sky-400/10 border-sky-400/20",
    title: "Curated Reels",
    desc: "Books, Gym, Diet, Mindset — hand-picked insights in 30-second reads.",
  },
  {
    icon: Dumbbell,
    color: "text-emerald-300",
    bg: "bg-emerald-400/10 border-emerald-400/20",
    title: "Community Reels",
    desc: "Share your own insights. Earn Vibe Score as others react.",
  },
  {
    icon: Sparkles,
    color: "text-rose-300",
    bg: "bg-rose-400/10 border-rose-400/20",
    title: "Daily Challenge",
    desc: "One community challenge every day. Join thousands taking action.",
  },
];

export default function LandingPage() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setStatus("checking");
    setErrorMsg("");

    try {
      const res = await fetch(
        `/api/auth/check-invite?code=${encodeURIComponent(code.trim())}`
      );
      const data = await res.json();

      if (data.valid) {
        router.push(`/signup?code=${encodeURIComponent(data.code)}`);
      } else {
        setStatus("error");
        setErrorMsg(data.message ?? "Invalid invite code");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Try again.");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(56,189,248,0.15),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-[60vh] bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(139,92,246,0.08),transparent)]" />
        {Array.from({ length: 35 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[2px] w-[2px] rounded-full bg-white"
            style={{
              left: `${(i * 31 + 7) % 100}%`,
              top: `${(i * 17 + 3) % 65}%`,
              opacity: 0.2,
            }}
            animate={{ opacity: [0.1, 0.5, 0.1] }}
            transition={{
              duration: 2 + (i % 4),
              repeat: Infinity,
              delay: (i % 5) * 0.6,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-md px-5 pb-20 pt-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/5 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-sky-300">
              Invitation Only
            </span>
          </div>

          <h1 className="mb-3 text-7xl font-black tracking-tighter text-white">
            Liftly
          </h1>
          <p className="text-xl font-medium text-slate-300 leading-relaxed">
            Positive reels that actually change your life.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Built for people serious about growth. Not for the algorithm — for you.
          </p>
        </motion.div>

        {/* Invite code form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-10"
        >
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <h2 className="mb-1 text-base font-bold text-white">Enter your invite code</h2>
            <p className="mb-5 text-sm text-slate-400">
              Get your code from someone already on Liftly.
            </p>

            <form onSubmit={handleInvite} className="space-y-3">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setStatus("idle");
                }}
                placeholder="e.g. SPARK-RISE-001"
                className={clsx(
                  "w-full rounded-xl border bg-slate-900/60 px-4 py-3.5 text-center font-mono text-sm font-bold text-white placeholder:font-sans placeholder:text-slate-600 outline-none transition",
                  status === "error"
                    ? "border-rose-500/50 focus:border-rose-500"
                    : "border-white/10 focus:border-sky-400/50"
                )}
                autoCapitalize="characters"
                spellCheck={false}
              />

              {status === "error" && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-sm text-rose-400"
                >
                  {errorMsg}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={!code.trim() || status === "checking"}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3.5 text-sm font-bold text-white transition hover:bg-sky-400 disabled:opacity-50"
              >
                {status === "checking" ? (
                  "Checking..."
                ) : (
                  <>
                    Join Liftly <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <span className="text-sm text-slate-500">Already have an account? </span>
              <Link href="/login" className="text-sm font-semibold text-sky-400 hover:text-sky-300">
                Sign in
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-12"
        >
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
            What makes Liftly different
          </p>
          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className={clsx("rounded-2xl border p-4", bg)}>
                <Icon className={clsx("mb-2 h-5 w-5", color)} />
                <h3 className="mb-1 text-sm font-bold text-white">{title}</h3>
                <p className="text-[11px] leading-[1.4] text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="mt-12 text-center text-xs text-slate-600">
          No ads. No toxicity. Just growth.
        </p>
      </div>
    </main>
  );
}
