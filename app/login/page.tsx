"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";
import { LiftlyLogo } from "@/components/LiftlyLogo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Service unavailable. Please try again.");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      const msg = authError.message;
      if (msg.includes("Invalid login credentials")) {
        setError("Wrong email or password. Please try again.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Please check your email and confirm your account first.");
      } else {
        setError(msg);
      }
      setLoading(false);
      return;
    }

    // Update streak on login
    await fetch("/api/streak", { method: "POST" }).catch(() => null);

    router.replace("/feed");
    router.refresh();
  }

  return (
    <main className="flex h-[100dvh] flex-col bg-background overflow-hidden">
      {/* Subtle top tint — stronger so it bleeds visually into status bar */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(6,182,212,0.12),transparent)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(6,182,212,0.18),transparent)]" />

      {/* Logo section */}
      <div className="pt-top-safe flex flex-col items-center pb-8 relative z-10">
        <Link href="/"><LiftlyLogo size={56} /></Link>
        <h1 className="mt-3 text-xl font-black text-foreground tracking-tight">Liftly</h1>
        <p className="mt-1 text-sm text-muted">Welcome back. Keep the streak going.</p>
      </div>

      {/* Form */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm mx-auto"
        >
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-[14px] border bg-[var(--input-bg)] px-4 py-3 text-[14px] text-foreground placeholder:text-muted outline-none focus:border-sky-500/50 dark:focus:border-sky-400/50 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.1)] transition-all"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-[14px] border bg-[var(--input-bg)] px-4 py-3 pr-11 text-[14px] text-foreground placeholder:text-muted outline-none focus:border-sky-500/50 dark:focus:border-sky-400/50 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.1)] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors tap-highlight"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[13px] text-rose-500 dark:text-rose-400"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-sky-500 to-blue-600 py-4 text-[14px] font-bold text-white shadow-[0_4px_20px_rgba(56,189,248,0.3)] transition-all hover:brightness-110 disabled:opacity-50 disabled:shadow-none tap-highlight"
            >
              {loading ? "Signing in..." : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Bottom links */}
      <div className="relative z-10 px-5 pb-8 pt-4 text-center">
        <p className="text-[13px] text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/" className="font-semibold text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors">
            Get an invite
          </Link>
        </p>
      </div>
    </main>
  );
}
