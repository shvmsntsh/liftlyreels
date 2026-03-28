"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Zap, Flame, Trophy } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LiftlyLogo } from "@/components/LiftlyLogo";

const pillars = [
  { icon: Zap, label: "Watch & Act", desc: "See it. Do it. Log it.", color: "#10b981" },
  { icon: Flame, label: "Build Streaks", desc: "Daily action keeps your streak alive.", color: "#f59e0b" },
  { icon: Trophy, label: "Earn Ranks", desc: "Rise from Rookie to Legend.", color: "#a855f7" },
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
    <main className="page-full relative flex h-[100dvh] flex-col items-center justify-between overflow-hidden px-5 pb-8 pt-12 bg-background">

      {/* Ambient orbs — visible in dark, very subtle in light */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-1/2 top-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full blur-[100px] dark:opacity-[0.18] opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #10b981 0%, #38bdf8 60%, transparent 75%)" }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-20 bottom-[25%] h-[200px] w-[200px] rounded-full blur-[80px] dark:opacity-[0.12] opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* ── Logo + headline ── */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      >
        <div className="relative mb-3">
          <motion.div
            className="absolute inset-[-8px] rounded-2xl blur-[18px] dark:opacity-50 opacity-30"
            style={{ background: "radial-gradient(circle, rgba(16,185,129,0.6), rgba(56,189,248,0.3), transparent)" }}
            animate={{ opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <LiftlyLogo size={60} animate />
        </div>

        <h1 className="text-[28px] font-black tracking-tight text-foreground">Liftly</h1>

        <h2 className="mt-2 text-[22px] font-extrabold leading-tight tracking-tight">
          <span className="text-foreground">Stop scrolling.</span>
          <br />
          <span className="bg-gradient-to-r dark:from-emerald-400 dark:via-teal-300 dark:to-sky-400 from-emerald-600 via-teal-500 to-sky-600 bg-clip-text text-transparent">
            Start proving.
          </span>
        </h2>

        <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-muted">
          Watch a reel, take real action, log the proof.
          Build streaks, earn ranks, and show the world.
        </p>
      </motion.div>

      {/* ── 3 pillars ── */}
      <motion.div
        className="relative z-10 flex w-full max-w-sm items-center justify-between gap-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      >
        {pillars.map(({ icon: Icon, label, desc, color }) => (
          <div
            key={label}
            className="flex flex-1 flex-col items-center rounded-2xl border bg-surface-1 p-3 text-center shadow-sm dark:shadow-none"
          >
            <div
              className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: `${color}1a` }}
            >
              <Icon className="h-4 w-4" style={{ color }} strokeWidth={1.8} />
            </div>
            <p className="text-[11px] font-bold text-foreground">{label}</p>
            <p className="mt-0.5 text-[9.5px] leading-tight text-muted">{desc}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Invite form ── */}
      <motion.div
        className="relative z-10 w-full max-w-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      >
        <p className="mb-3 text-center text-[12px] font-bold uppercase tracking-[0.15em] text-muted">
          Invite only — enter your code
        </p>

        <form onSubmit={handleInvite} className="space-y-3">
          <motion.input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setStatus("idle");
            }}
            placeholder="SPARK-RISE-001"
            className="w-full rounded-2xl border bg-[var(--input-bg)] px-4 py-3.5 text-center font-mono text-[14px] font-semibold tracking-widest text-foreground placeholder:font-sans placeholder:text-[12px] placeholder:font-normal placeholder:tracking-normal placeholder:text-muted outline-none transition-all focus:border-emerald-500/40 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]"
            autoCapitalize="characters"
            spellCheck={false}
            whileFocus={{ scale: 1.01 }}
          />

          <AnimatePresence>
            {status === "error" && (
              <motion.p
                className="text-center text-[12px] text-red-500 dark:text-red-400"
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
            className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 text-[14px] font-bold text-white shadow-[0_4px_24px_rgba(16,185,129,0.35)] transition-all disabled:opacity-40"
            whileHover={{ scale: 1.02, filter: "brightness(1.08)" }}
            whileTap={{ scale: 0.97 }}
          >
            {status === "checking" ? (
              <span className="flex items-center gap-2">
                <motion.span
                  className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.65, repeat: Infinity, ease: "linear" }}
                />
                Checking...
              </span>
            ) : (
              <>
                Start Proving
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* ── Footer ── */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <p className="text-[13px] text-muted">
          Already a member?{" "}
          <Link href="/login" className="font-semibold text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors">
            Sign in
          </Link>
        </p>
        <div className="mt-2 flex justify-center gap-4 text-[10px] text-muted opacity-60">
          <Link href="/terms" className="hover:opacity-100 transition-opacity">Terms</Link>
          <Link href="/privacy" className="hover:opacity-100 transition-opacity">Privacy</Link>
        </div>
      </motion.div>
    </main>
  );
}
