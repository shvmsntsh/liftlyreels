"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check, Mail } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { getSupabaseClient } from "@/lib/supabase";

function SignupForm() {
  const searchParams = useSearchParams();
  const urlCode = searchParams.get("code") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState(urlCode);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<"account" | "verify" | "profile" | "done">("account");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const router = useRouter();

  async function handleAccountStep(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Service unavailable.");
      setLoading(false);
      return;
    }

    // Try sign-up
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    // If email already registered, try signing them in directly
    const alreadyExists =
      authError?.message?.toLowerCase().includes("already") ||
      (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0);

    if (alreadyExists) {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (signInError) {
        setError("This email is already registered. Check your password or sign in.");
        setLoading(false);
        return;
      }

      if (signInData.session?.access_token) {
        // Existing user signed in — check if they have a profile
        setUserId(signInData.user.id);
        setAccessToken(signInData.session.access_token);
        setStep("profile");
        setLoading(false);
        return;
      }
    }

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      setUserId(data.user.id);

      if (data.session?.access_token) {
        // Email confirmation disabled — live session, go to profile
        setAccessToken(data.session.access_token);
        setStep("profile");
      } else {
        // Email confirmation required — show verify screen
        setStep("verify");
      }
    } else {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  async function handleProfileStep(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        accessToken,
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        inviteCode,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      // If profile already exists, just go to feed
      if (data.error?.includes("already") || data.error?.includes("taken") === false) {
        // username taken — show error
      }
      if (data.error?.includes("already") && !data.error?.includes("Username")) {
        await fetch("/api/streak", { method: "POST" }).catch(() => null);
        setStep("done");
        setTimeout(() => { router.push("/feed"); router.refresh(); }, 1200);
        return;
      }
      setError(data.error ?? "Failed to create profile");
      setLoading(false);
      return;
    }

    await fetch("/api/streak", { method: "POST" }).catch(() => null);
    setStep("done");
    setTimeout(() => {
      router.push("/feed");
      router.refresh();
    }, 1400);
  }

  // ── Done ──
  if (step === "done") {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20">
          <Check className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">You&apos;re in!</h2>
        <p className="mt-2 text-slate-400">Taking you to your feed...</p>
      </motion.div>
    );
  }

  // ── Email verification pending ──
  if (step === "verify") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mb-5 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-400/15 border border-sky-400/30">
          <Mail className="h-7 w-7 text-sky-300" />
        </div>
        <h2 className="text-2xl font-bold text-white">Check your email</h2>
        <p className="mt-2 text-[15px] text-slate-400 leading-relaxed">
          We sent a confirmation link to
        </p>
        <p className="mt-1 font-semibold text-sky-300">{email}</p>
        <p className="mt-4 text-[13px] text-slate-500 leading-relaxed max-w-xs mx-auto">
          Click the link in the email to confirm your account. You&apos;ll be taken back here to finish setting up your profile.
        </p>
        <div className="mt-8 rounded-2xl border border-white/8 bg-slate-950/60 p-4 text-left">
          <p className="text-[12px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">Having issues?</p>
          <p className="text-[12px] text-slate-400">Check your spam folder, or{" "}
            <button
              onClick={() => setStep("account")}
              className="text-sky-400 hover:text-sky-300 font-semibold"
            >
              try a different email
            </button>
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <Link href="/" className="text-4xl font-black text-white hover:text-sky-300 transition">
          Liftly
        </Link>
        <p className="mt-1.5 text-[13px] text-slate-500">
          {step === "account" ? "Create your account" : "Set up your profile"}
        </p>
      </div>

      {/* Step dots */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {["account", "profile"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={clsx(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
              step === s ? "bg-sky-500 text-white shadow-[0_0_12px_rgba(56,189,248,0.5)]"
                : s === "account" && step === "profile" ? "bg-sky-500/80 text-white"
                : "border border-white/15 text-slate-600"
            )}>
              {s === "account" && step === "profile" ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i === 0 && <div className={clsx("h-px w-8 transition-all", step === "profile" ? "bg-sky-500" : "bg-white/10")} />}
          </div>
        ))}
      </div>

      <div className="rounded-[24px] border border-white/8 bg-slate-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
        {/* ── Step 1: Account ── */}
        {step === "account" && (
          <form onSubmit={handleAccountStep} className="space-y-4" autoComplete="on">
            <div>
              <label htmlFor="su-invite" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
                Invite Code
              </label>
              <input
                id="su-invite"
                type="text"
                name="invite-code"
                autoComplete="off"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                placeholder="e.g. SPARK-RISE-001"
                maxLength={30}
                className="w-full rounded-[14px] border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3.5 text-[14px] text-foreground font-mono tracking-wider placeholder:text-muted placeholder:font-sans placeholder:tracking-normal outline-none focus:border-sky-400/50 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.1)] transition-all"
                required
              />
              <p className="mt-1 text-[11px] text-slate-600">Got a code from a friend? Enter it here.</p>
            </div>
            <div>
              <label htmlFor="su-email" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
                Email
              </label>
              <input
                id="su-email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-[14px] border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3.5 text-[14px] text-foreground placeholder:text-muted outline-none focus:border-sky-400/50 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.1)] transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="su-pass" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
                Password
              </label>
              {/* Wrapper with isolation to prevent autofill overlay covering button */}
              <div className="relative isolate">
                <input
                  id="su-pass"
                  type={showPass ? "text" : "password"}
                  name="new-password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  minLength={8}
                  className="w-full rounded-[14px] border border-white/8 bg-slate-900 px-4 py-3.5 pr-12 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-sky-400/50 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.1)] transition-all"
                  required
                />
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault(); // prevent focus shift
                    setShowPass((v) => !v);
                  }}
                  className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-slate-500 hover:text-white transition-colors z-10 tap-highlight"
                  tabIndex={-1}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-[13px] text-rose-400">{error}</motion.p>
            )}

            <button
              type="submit"
              disabled={loading || !email || password.length < 8 || !inviteCode.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-sky-500 to-blue-600 py-4 text-[14px] font-bold text-white shadow-[0_4px_20px_rgba(56,189,248,0.3)] transition-all hover:brightness-110 disabled:opacity-50 disabled:shadow-none tap-highlight"
            >
              {loading ? "Creating account..." : <>Continue <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        )}

        {/* ── Step 2: Profile ── */}
        {step === "profile" && (
          <form onSubmit={handleProfileStep} className="space-y-4" autoComplete="off">
            <div>
              <label htmlFor="su-username" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
                Username
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[14px] select-none">@</span>
                <input
                  id="su-username"
                  type="text"
                  name="username"
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="yourhandle"
                  maxLength={20}
                  className="w-full rounded-[14px] border border-white/8 bg-slate-900 pl-8 pr-4 py-3.5 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-sky-400/50 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.1)] transition-all"
                  required
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-600">Letters, numbers, underscores only.</p>
            </div>
            <div>
              <label htmlFor="su-displayname" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
                Display Name
              </label>
              <input
                id="su-displayname"
                type="text"
                name="displayname"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you want to appear"
                maxLength={40}
                className="w-full rounded-[14px] border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3.5 text-[14px] text-foreground placeholder:text-muted outline-none focus:border-sky-400/50 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.1)] transition-all"
                required
              />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-[13px] text-rose-400">{error}</motion.p>
            )}

            <button
              type="submit"
              disabled={loading || username.length < 2 || !displayName}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-sky-500 to-blue-600 py-4 text-[14px] font-bold text-white shadow-[0_4px_20px_rgba(56,189,248,0.3)] transition-all hover:brightness-110 disabled:opacity-50 disabled:shadow-none tap-highlight"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Setting up...
                </span>
              ) : <>Join Liftly <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        )}
      </div>

      <p className="mt-5 text-center text-[13px] text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-sky-400 hover:text-sky-300 transition-colors">
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function SignupPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(56,189,248,0.1),transparent)]" />
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="text-slate-400 text-center">Loading...</div>}>
          <SignupForm />
        </Suspense>
      </div>
    </main>
  );
}
