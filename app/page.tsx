"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Flame, BookOpen, Dumbbell, Brain, ArrowRight, Sparkles, Trophy, Activity } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const features = [
  {
    icon: Zap,
    gradient: "from-amber-500/20 to-yellow-500/5",
    border: "border-amber-400/20",
    iconColor: "text-amber-300",
    title: "Spark Reactions",
    desc: "React meaningfully — ⚡ Sparked, 🔥 Fired Up, 🔖 Saved. Not just likes.",
  },
  {
    icon: Flame,
    gradient: "from-orange-500/20 to-red-500/5",
    border: "border-orange-400/20",
    iconColor: "text-orange-300",
    title: "Daily Streaks",
    desc: "Build an unbreakable habit. Show up daily, earn your streak.",
  },
  {
    icon: Brain,
    gradient: "from-violet-500/20 to-purple-500/5",
    border: "border-violet-400/20",
    iconColor: "text-violet-300",
    title: "Impact Journal",
    desc: "Log real actions you took. Track your actual growth, not just views.",
  },
  {
    icon: BookOpen,
    gradient: "from-sky-500/20 to-blue-500/5",
    border: "border-sky-400/20",
    iconColor: "text-sky-300",
    title: "Curated Reels",
    desc: "Books, Gym, Diet, Mindset — hand-picked insights in 30-second reads.",
  },
  {
    icon: Dumbbell,
    gradient: "from-emerald-500/20 to-green-500/5",
    border: "border-emerald-400/20",
    iconColor: "text-emerald-300",
    title: "Create & Share",
    desc: "Post your own insights. Earn Vibe Score as your community grows.",
  },
  {
    icon: Trophy,
    gradient: "from-rose-500/20 to-pink-500/5",
    border: "border-rose-400/20",
    iconColor: "text-rose-300",
    title: "Daily Challenge",
    desc: "One community challenge daily. Join thousands taking real action.",
  },
];

const stats = [
  { value: "100%", label: "Positive content" },
  { value: "0", label: "Ads" },
  { value: "5", label: "Categories" },
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
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(56,189,248,0.18),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-[50vh] bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,rgba(139,92,246,0.1),transparent)]" />
        {/* Animated particles */}
        {Array.from({ length: 28 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              left: `${(i * 37 + 5) % 100}%`,
              top: `${(i * 19 + 8) % 70}%`,
              opacity: 0.15,
            }}
            animate={{ opacity: [0.08, 0.4, 0.08], y: [0, -8, 0] }}
            transition={{
              duration: 3 + (i % 5),
              repeat: Infinity,
              delay: (i % 7) * 0.5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-md px-5 pb-16 pt-14">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/8 px-4 py-1.5 shadow-[0_0_20px_rgba(56,189,248,0.1)]">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-300">
              Invitation Only
            </span>
          </div>

          <h1 className="mb-3 text-[5.5rem] font-black tracking-[-0.04em] text-white leading-none">
            Liftly
          </h1>
          <p className="text-[1.2rem] font-semibold text-slate-200 leading-relaxed">
            Positive reels that actually<br />change your life.
          </p>
          <p className="mt-2.5 text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            Built for people serious about growth — not the algorithm, but <em className="text-slate-400 not-italic font-medium">you</em>.
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-8 flex items-center justify-center gap-8"
        >
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-[11px] text-slate-500 font-medium">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Invite code card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mt-8"
        >
          <div className="rounded-[24px] border border-white/8 bg-slate-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-sky-400" />
              <h2 className="text-[15px] font-bold text-white">Enter your invite code</h2>
            </div>
            <p className="mb-5 text-[13px] text-slate-500">
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
                  "w-full rounded-[14px] border bg-slate-900/80 px-4 py-3.5 text-center font-mono text-[13px] font-bold text-white placeholder:font-sans placeholder:font-normal placeholder:text-slate-600 outline-none transition-all duration-200",
                  status === "error"
                    ? "border-rose-500/60 shadow-[0_0_0_3px_rgba(244,63,94,0.12)]"
                    : "border-white/8 focus:border-sky-400/50 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.1)]"
                )}
                autoCapitalize="characters"
                spellCheck={false}
              />

              {status === "error" && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-[13px] text-rose-400"
                >
                  {errorMsg}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={!code.trim() || status === "checking"}
                className="group flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-sky-500 to-blue-600 py-4 text-[14px] font-bold text-white shadow-[0_4px_20px_rgba(56,189,248,0.35)] transition-all hover:shadow-[0_4px_24px_rgba(56,189,248,0.5)] hover:brightness-110 disabled:opacity-50 disabled:shadow-none tap-highlight"
              >
                {status === "checking" ? (
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4 animate-pulse" /> Checking...
                  </span>
                ) : (
                  <>
                    Join Liftly
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <span className="text-[13px] text-slate-500">Already have an account? </span>
              <Link href="/login" className="text-[13px] font-semibold text-sky-400 hover:text-sky-300 transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-10"
        >
          <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-slate-600">
            What makes Liftly different
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {features.map(({ icon: Icon, gradient, border, iconColor, title, desc }) => (
              <div
                key={title}
                className={clsx(
                  "rounded-[18px] border bg-gradient-to-br p-4",
                  gradient,
                  border
                )}
              >
                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white/8">
                  <Icon className={clsx("h-4 w-4", iconColor)} strokeWidth={2} />
                </div>
                <h3 className="mb-1 text-[13px] font-bold text-white">{title}</h3>
                <p className="text-[11px] leading-[1.45] text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="mt-10 text-center text-[11px] text-slate-700">
          No ads · No toxicity · Just growth
        </p>
      </div>
    </main>
  );
}
