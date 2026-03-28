"use client";

import { useState, useEffect } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import { LiftlyLogo } from "@/components/LiftlyLogo";

// ── Animation variants ─────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const fadeScale = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", damping: 18, stiffness: 260 } },
};

const popIn = {
  hidden: { opacity: 0, scale: 0.6, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 14, stiffness: 400 } },
};

// ── Data ───────────────────────────────────────────────────────
const steps = [
  { icon: Play, text: "Watch a reel", color: "text-sky-400" },
  { icon: CheckCircle, text: "Tap 'I Did This'", color: "text-emerald-400" },
  { icon: Camera, text: "Attach proof", color: "text-violet-400" },
  { icon: TrendingUp, text: "Level up", color: "text-amber-400" },
];

const pillars = [
  {
    icon: Target,
    title: "Act, don't scroll",
    desc: "Every reel has an 'I Did This' button. Prove you took action.",
    color: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.2)",
    accent: "#10b981",
    from: "left",
  },
  {
    icon: Camera,
    title: "Show your proof",
    desc: "Snap a photo — gym selfie, book page, healthy meal. Your proof wall is your real profile.",
    color: "rgba(56,189,248,0.12)",
    border: "rgba(56,189,248,0.2)",
    accent: "#38bdf8",
    from: "right",
  },
  {
    icon: Flame,
    title: "Build streaks",
    desc: "Daily action streaks, vibe scores, and ranks. Miss a day, lose your streak.",
    color: "rgba(251,146,60,0.12)",
    border: "rgba(251,146,60,0.2)",
    accent: "#fb923c",
    from: "left",
  },
  {
    icon: Trophy,
    title: "Earn your feed",
    desc: "Complete challenges to unlock reward content. The more you do, the more you get.",
    color: "rgba(168,85,247,0.12)",
    border: "rgba(168,85,247,0.2)",
    accent: "#a855f7",
    from: "right",
  },
];

const categories = [
  { icon: Brain, label: "Mindset", hue: "rgba(168,85,247,0.15)" },
  { icon: Dumbbell, label: "Gym", hue: "rgba(56,189,248,0.15)" },
  { icon: BookOpen, label: "Books", hue: "rgba(251,146,60,0.15)" },
  { icon: Flame, label: "Diet", hue: "rgba(248,113,113,0.15)" },
  { icon: Shield, label: "Wellness", hue: "rgba(52,211,153,0.15)" },
];

// ── Component ──────────────────────────────────────────────────
export default function LandingPage() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [btnHover, setBtnHover] = useState(false);
  const router = useRouter();

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setStatus("checking");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/auth/check-invite?code=${encodeURIComponent(code.trim())}`);
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
    <main className="relative flex min-h-[100dvh] flex-col items-center overflow-hidden px-5 pb-14 pt-14">

      {/* ── Ambient orbs ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Primary emerald orb */}
        <motion.div
          className="absolute left-1/2 top-[5%] h-[340px] w-[340px] -translate-x-1/2 rounded-full opacity-25 blur-[130px]"
          style={{ background: "radial-gradient(circle, #10b981 0%, #38bdf8 50%, transparent 75%)" }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Purple orb bottom-right */}
        <motion.div
          className="absolute -right-16 bottom-[20%] h-[250px] w-[250px] rounded-full opacity-15 blur-[100px]"
          style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        {/* Amber orb left */}
        <motion.div
          className="absolute -left-12 top-[45%] h-[180px] w-[180px] rounded-full opacity-12 blur-[80px]"
          style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
      </div>

      <motion.div
        className="relative z-10 flex w-full max-w-[400px] flex-col items-center"
        variants={container}
        initial="hidden"
        animate="show"
      >

        {/* ── Logo ── */}
        <motion.div className="flex flex-col items-center" variants={fadeUp}>
          <motion.div
            className="relative"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 14, stiffness: 260, delay: 0.05 }}
          >
            {/* Glow ring behind mark */}
            <motion.div
              className="absolute inset-[-6px] rounded-2xl blur-[14px] opacity-60"
              style={{ background: "radial-gradient(circle, rgba(16,185,129,0.5), rgba(56,189,248,0.3), transparent)" }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <LiftlyLogo size={64} animate />
          </motion.div>

          <motion.h1
            className="mt-3 text-[32px] font-black tracking-tight"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
          >
            Liftly
          </motion.h1>
        </motion.div>

        {/* ── Headline ── */}
        <motion.div className="mt-6 text-center" variants={fadeUp}>
          <h2 className="text-[27px] font-extrabold leading-[1.15] tracking-tight">
            <motion.span
              className="block"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            >
              Stop scrolling.
            </motion.span>
            <motion.span
              className="block bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            >
              Start proving.
            </motion.span>
          </h2>
          <motion.p
            className="mx-auto mt-3 max-w-[300px] text-[13px] leading-relaxed text-[var(--muted)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            The app where watching isn&apos;t enough. See a reel, do the thing,
            snap your proof. Your action log is your new highlight reel.
          </motion.p>
        </motion.div>

        {/* ── Action steps ── */}
        <motion.div
          className="mt-6 flex w-full items-center justify-center gap-2"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {steps.map(({ icon: Icon, text, color }, i) => (
            <motion.div key={text} className="flex items-center gap-1.5" variants={popIn}>
              <div className="flex flex-col items-center gap-1.5">
                <motion.div
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/8"
                  whileHover={{ scale: 1.15, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Icon className={clsx("h-4 w-4", color)} strokeWidth={2} />
                </motion.div>
                <span className="text-[8.5px] font-semibold text-[var(--muted)] text-center leading-tight max-w-[56px]">
                  {text}
                </span>
              </div>
              {i < steps.length - 1 && (
                <motion.div
                  className="mb-4"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                >
                  <ArrowRight className="h-2.5 w-2.5 text-[var(--muted)]/25" strokeWidth={2} />
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* ── Category pills ── */}
        <motion.div className="mt-5 flex w-full justify-center gap-3" variants={fadeUp}>
          {categories.map(({ icon: Icon, label, hue }, i) => (
            <motion.div
              key={label}
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.06, type: "spring", damping: 16, stiffness: 300 }}
              whileHover={{ y: -3, scale: 1.05 }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: hue }}
              >
                <Icon className="h-[16px] w-[16px] text-[var(--accent)]" strokeWidth={1.7} />
              </div>
              <span className="text-[8.5px] font-medium uppercase tracking-wider text-[var(--muted)]">
                {label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Invite card ── */}
        <motion.div
          className="mt-6 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5"
          variants={fadeScale}
        >
          <h2 className="text-[14px] font-bold tracking-wide">Ready to prove it?</h2>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">
            Get an invite code from someone already taking action
          </p>

          <form onSubmit={handleInvite} className="mt-4 space-y-3">
            <motion.input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setStatus("idle");
              }}
              placeholder="SPARK-RISE-001"
              className={clsx(
                "w-full rounded-xl border bg-[var(--background)] px-4 py-3 text-center font-mono text-[13px] font-semibold tracking-widest placeholder:font-sans placeholder:text-[11px] placeholder:font-normal placeholder:tracking-normal placeholder:text-[var(--muted)]/40 outline-none transition-all",
                status === "error"
                  ? "border-red-500/40 focus:border-red-500/60"
                  : "border-[var(--border)] focus:border-emerald-500/40"
              )}
              whileFocus={{ scale: 1.01 }}
              autoCapitalize="characters"
              spellCheck={false}
            />

            <AnimatePresence>
              {status === "error" && (
                <motion.p
                  className="text-center text-[11px] text-red-400"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {errorMsg}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={!code.trim() || status === "checking"}
              className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-500 py-3 text-[13px] font-bold text-white transition-all disabled:opacity-30"
              whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
              whileTap={{ scale: 0.97 }}
              onHoverStart={() => setBtnHover(true)}
              onHoverEnd={() => setBtnHover(false)}
            >
              {/* Shimmer sweep */}
              <AnimatePresence>
                {btnHover && (
                  <motion.div
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                )}
              </AnimatePresence>

              {status === "checking" ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                  />
                  Checking
                </span>
              ) : (
                <>
                  Start Proving
                  <motion.div
                    animate={{ x: btnHover ? 3 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </motion.div>
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-3.5 text-center">
            <span className="text-[11px] text-[var(--muted)]/70">Already a member? </span>
            <Link
              href="/login"
              className="text-[11px] font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
            >
              Sign in
            </Link>
          </div>
        </motion.div>

        {/* ── Pillars ── */}
        <motion.div className="mt-8 w-full" variants={fadeUp}>
          <motion.h3
            className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]/50"
            variants={fadeUp}
          >
            Not another content app
          </motion.h3>
          <div className="grid grid-cols-2 gap-3">
            {pillars.map(({ icon: Icon, title, desc, color, border, accent, from }, i) => (
              <motion.div
                key={title}
                className="rounded-2xl p-4"
                style={{ background: color, border: `1px solid ${border}` }}
                initial={{ opacity: 0, x: from === "left" ? -20 : 20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1, type: "spring", damping: 20, stiffness: 260 }}
                whileHover={{ scale: 1.03, y: -2 }}
              >
                <motion.div
                  className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: `${accent}20` }}
                  whileHover={{ rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <Icon className="h-[18px] w-[18px]" style={{ color: accent }} strokeWidth={1.8} />
                </motion.div>
                <h4 className="text-[12px] font-bold leading-tight">{title}</h4>
                <p className="mt-1 text-[10.5px] leading-[1.45] text-[var(--muted)]">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Social proof ── */}
        <motion.div className="mt-6 flex items-center gap-2" variants={fadeUp}>
          <div className="flex -space-x-2">
            {["bg-emerald-500", "bg-sky-500", "bg-purple-500", "bg-amber-500"].map((bg, i) => (
              <motion.div
                key={i}
                className={`h-6 w-6 rounded-full border-2 border-[var(--background)] ${bg} flex items-center justify-center`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.07, type: "spring", damping: 12, stiffness: 300 }}
              >
                <Zap className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
              </motion.div>
            ))}
          </div>
          <p className="text-[11px] text-[var(--muted)]">
            <span className="font-semibold text-[var(--foreground)]">Early members</span> are already proving it
          </p>
        </motion.div>

        {/* ── Footer ── */}
        <motion.div className="mt-6 flex flex-col items-center gap-2" variants={fadeUp}>
          <p className="text-center text-[10px] font-medium tracking-wide text-[var(--muted)]/30">
            No doom scrolling &middot; No fake motivation &middot; Just proof
          </p>
          <div className="flex gap-4 text-[10px] text-[var(--muted)]/20">
            <a href="/terms" className="hover:text-[var(--muted)]/50 transition">Terms</a>
            <a href="/privacy" className="hover:text-[var(--muted)]/50 transition">Privacy</a>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
