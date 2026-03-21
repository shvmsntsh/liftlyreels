"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Dumbbell,
  Brain,
  Flame,
  Shield,
  Mail,
  Layers,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const categories = [
  { icon: Brain, label: "Mindset", hue: "rgba(168,85,247,0.14)" },
  { icon: Dumbbell, label: "Gym", hue: "rgba(56,189,248,0.14)" },
  { icon: BookOpen, label: "Books", hue: "rgba(251,146,60,0.14)" },
  { icon: Flame, label: "Diet", hue: "rgba(248,113,113,0.14)" },
  { icon: Shield, label: "Wellness", hue: "rgba(52,211,153,0.14)" },
];

const steps = [
  { icon: Mail, text: "Get invited" },
  { icon: Layers, text: "Swipe reels" },
  { icon: TrendingUp, text: "Track growth" },
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
    <main className="relative flex h-[100dvh] flex-col items-center justify-center overflow-hidden px-5">
      {/* Animated gradient orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[18%] -translate-x-1/2"
      >
        <motion.div
          className="h-[260px] w-[260px] rounded-full opacity-40 blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, rgba(56,189,248,0.55) 0%, rgba(99,102,241,0.35) 50%, transparent 80%)",
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.35, 0.5, 0.35],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <motion.div
        className="relative z-10 flex w-full max-w-[360px] flex-col items-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Logo + tagline */}
        <motion.div className="text-center" variants={item}>
          <h1 className="text-[42px] font-black leading-none tracking-tight">
            Liftly
          </h1>
          <p className="mt-1.5 text-[14px] font-medium tracking-wide text-[var(--muted)]">
            Reels that actually improve your life
          </p>
        </motion.div>

        {/* Category icon row */}
        <motion.div
          className="mt-6 flex w-full justify-center gap-4"
          variants={item}
        >
          {categories.map(({ icon: Icon, label, hue }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: hue }}
              >
                <Icon
                  className="h-[18px] w-[18px] text-[var(--accent)]"
                  strokeWidth={1.7}
                />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--muted)]">
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
          <h2 className="text-[13px] font-semibold tracking-wide">
            Enter your invite code
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">
            Get a code from someone already on Liftly
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
                  : "border-[var(--border)] focus:border-[var(--accent)]/40"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-[13px] font-bold text-[var(--on-accent)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-30 disabled:hover:brightness-100"
            >
              {status === "checking" ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    className="inline-block h-3.5 w-3.5 rounded-full border-2 border-[var(--on-accent)] border-t-transparent"
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
                  Join Liftly
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
              className="text-[11px] font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
            >
              Sign in
            </Link>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          className="mt-5 flex w-full items-center justify-center gap-3"
          variants={item}
        >
          {steps.map(({ icon: Icon, text }, i) => (
            <div key={text} className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--surface-2)]">
                  <Icon
                    className="h-3 w-3 text-[var(--accent)]"
                    strokeWidth={2}
                  />
                </div>
                <span className="text-[10px] font-medium text-[var(--muted)]">
                  {text}
                </span>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight
                  className="h-2.5 w-2.5 text-[var(--muted)]/30"
                  strokeWidth={2}
                />
              )}
            </div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.p
          className="mt-5 text-center text-[10px] font-medium tracking-wide text-[var(--muted)]/25"
          variants={item}
        >
          No ads &middot; No toxicity &middot; Invitation only
        </motion.p>
      </motion.div>
    </main>
  );
}
