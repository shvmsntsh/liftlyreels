"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle,
  Camera,
  Play,
  TrendingUp,
  Zap,
  Flame,
  Target,
  Dumbbell,
  Brain,
  BookOpen,
  Shield,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

const steps = [
  { icon: Play, text: "Watch a reel" },
  { icon: CheckCircle, text: "Tap 'I Did This'" },
  { icon: Camera, text: "Attach proof" },
  { icon: TrendingUp, text: "Level up" },
];

const pillars = [
  {
    icon: Target,
    title: "Act, don't scroll",
    desc: "Every reel has an 'I Did This' button. Prove you took action.",
    color: "rgba(16,185,129,0.15)",
    accent: "#10b981",
  },
  {
    icon: Camera,
    title: "Show your proof",
    desc: "Attach a photo — gym selfie, book page, healthy meal. Your proof wall is your real profile.",
    color: "rgba(56,189,248,0.15)",
    accent: "#38bdf8",
  },
  {
    icon: Flame,
    title: "Build streaks",
    desc: "Daily action streaks, vibe scores, and ranks. Miss a day, lose your streak.",
    color: "rgba(251,146,60,0.15)",
    accent: "#fb923c",
  },
  {
    icon: Trophy,
    title: "Earn your feed",
    desc: "Complete daily challenges to unlock reward content. The more you do, the more you get.",
    color: "rgba(168,85,247,0.15)",
    accent: "#a855f7",
  },
];

const categories = [
  { icon: Brain, label: "Mindset", hue: "rgba(168,85,247,0.14)" },
  { icon: Dumbbell, label: "Gym", hue: "rgba(56,189,248,0.14)" },
  { icon: BookOpen, label: "Books", hue: "rgba(251,146,60,0.14)" },
  { icon: Flame, label: "Diet", hue: "rgba(248,113,113,0.14)" },
  { icon: Shield, label: "Wellness", hue: "rgba(52,211,153,0.14)" },
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
    <main className="relative flex min-h-[100dvh] flex-col items-center overflow-hidden px-5 pb-12 pt-16">
      {/* Animated gradient orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-1/2 top-[8%] h-[300px] w-[300px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(16,185,129,0.6) 0%, rgba(56,189,248,0.3) 50%, transparent 80%)",
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-10%] top-[60%] h-[200px] w-[200px] rounded-full opacity-20 blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <motion.div
        className="relative z-10 flex w-full max-w-[400px] flex-col items-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Logo */}
        <motion.div className="text-center" variants={item}>
          <h1 className="text-[40px] font-black leading-none tracking-tight">
            Liftly
          </h1>
        </motion.div>

        {/* Headline — the hook */}
        <motion.div className="mt-5 text-center" variants={item}>
          <h2 className="text-[26px] font-extrabold leading-[1.15] tracking-tight">
            Stop scrolling.
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              Start proving.
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-[320px] text-[13.5px] leading-relaxed text-[var(--muted)]">
            The app where watching isn&apos;t enough. See a reel, do the thing,
            snap your proof. Your action log is your new highlight reel.
          </p>
        </motion.div>

        {/* How it works — action flow */}
        <motion.div
          className="mt-6 flex w-full items-center justify-center gap-2"
          variants={item}
        >
          {steps.map(({ icon: Icon, text }, i) => (
            <div key={text} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface-2)]">
                  <Icon
                    className="h-3.5 w-3.5 text-emerald-400"
                    strokeWidth={2}
                  />
                </div>
                <span className="text-[9.5px] font-semibold text-[var(--muted)]">
                  {text}
                </span>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight
                  className="h-2.5 w-2.5 text-[var(--muted)]/25"
                  strokeWidth={2}
                />
              )}
            </div>
          ))}
        </motion.div>

        {/* Category pills */}
        <motion.div
          className="mt-5 flex w-full justify-center gap-3"
          variants={item}
        >
          {categories.map(({ icon: Icon, label, hue }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: hue }}
              >
                <Icon
                  className="h-[16px] w-[16px] text-[var(--accent)]"
                  strokeWidth={1.7}
                />
              </div>
              <span className="text-[8.5px] font-medium uppercase tracking-wider text-[var(--muted)]">
                {label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Invite card */}
        <motion.div
          className="mt-6 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5"
          variants={item}
        >
          <h2 className="text-[14px] font-bold tracking-wide">
            Ready to prove it?
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">
            Get an invite code from someone already taking action
          </p>

          <form onSubmit={handleInvite} className="mt-4 space-y-3">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setStatus("idle");
              }}
              placeholder="SPARK-RISE-001"
              className={clsx(
                "w-full rounded-xl border bg-[var(--background)] px-4 py-3 text-center font-mono text-[13px] font-semibold tracking-widest placeholder:font-sans placeholder:text-[11px] placeholder:font-normal placeholder:tracking-normal placeholder:text-[var(--muted)]/40 outline-none transition-colors",
                status === "error"
                  ? "border-red-500/40 focus:border-red-500/60"
                  : "border-[var(--border)] focus:border-emerald-500/40"
              )}
              autoCapitalize="characters"
              spellCheck={false}
            />

            {status === "error" && (
              <p className="text-center text-[11px] text-red-400">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={!code.trim() || status === "checking"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-[13px] font-bold text-white transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-30 disabled:hover:bg-emerald-500"
            >
              {status === "checking" ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  Checking
                </span>
              ) : (
                <>
                  Start Proving
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <div className="mt-3.5 text-center">
            <span className="text-[11px] text-[var(--muted)]/70">
              Already a member?{" "}
            </span>
            <Link
              href="/login"
              className="text-[11px] font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
            >
              Sign in
            </Link>
          </div>
        </motion.div>

        {/* What makes Liftly different */}
        <motion.div className="mt-8 w-full" variants={item}>
          <h3 className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]/60">
            Not another content app
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {pillars.map(({ icon: Icon, title, desc, color, accent }) => (
              <motion.div
                key={title}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <div
                  className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: color }}
                >
                  <Icon
                    className="h-[18px] w-[18px]"
                    style={{ color: accent }}
                    strokeWidth={1.8}
                  />
                </div>
                <h4 className="text-[12px] font-bold leading-tight">{title}</h4>
                <p className="mt-1 text-[10.5px] leading-[1.45] text-[var(--muted)]">
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Social proof line */}
        <motion.div
          className="mt-6 flex items-center gap-2"
          variants={item}
        >
          <div className="flex -space-x-2">
            {["bg-emerald-500", "bg-sky-500", "bg-purple-500", "bg-amber-500"].map((bg, i) => (
              <div
                key={i}
                className={`h-6 w-6 rounded-full border-2 border-[var(--background)] ${bg} flex items-center justify-center`}
              >
                <Zap className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[var(--muted)]">
            <span className="font-semibold text-[var(--foreground)]">Early members</span> are already proving it
          </p>
        </motion.div>

        {/* Footer */}
        <motion.p
          className="mt-6 text-center text-[10px] font-medium tracking-wide text-[var(--muted)]/30"
          variants={item}
        >
          No doom scrolling &middot; No fake motivation &middot; Just proof
        </motion.p>
      </motion.div>
    </main>
  );
}
