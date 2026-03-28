"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check, Eye, EyeOff, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { getSupabaseClient } from "@/lib/supabase";
import { LiftlyLogo } from "@/components/LiftlyLogo";

function SignupForm() {
  const searchParams = useSearchParams();
  const urlCode = searchParams.get("code") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState(urlCode);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const codeVerified = !!urlCode;
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

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    // ── Validate invite code FIRST (before creating auth account) ──
    try {
      const checkRes = await fetch(`/api/auth/check-invite?code=${encodeURIComponent(inviteCode.trim())}`);
      const checkData = await checkRes.json();
      if (!checkData.valid) {
        setError(checkData.message || "Invalid invite code");
        setLoading(false);
        return;
      }
    } catch {
      setError("Could not validate invite code. Try again.");
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Service unavailable.");
      setLoading(false);
      return;
    }

    // Try sign-up (store invite code in user metadata for email confirmation flow)
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { invite_code: inviteCode.trim() },
      },
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
        fetch("/api/streak", { method: "POST" }).catch(() => null); // fire and forget
        setStep("done");
        setTimeout(() => { router.push("/feed"); router.refresh(); }, 1200);
        return;
      }
      setError(data.error ?? "Failed to create profile");
      setLoading(false);
      return;
    }

    fetch("/api/streak", { method: "POST" }).catch(() => null); // fire and forget
    setStep("done");
    setTimeout(() => {
      router.push("/feed");
      router.refresh();
    }, 1400);
  }

  // ── Done ──
  if (step === "done") {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-background pt-safe">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="mb-5 mx-auto"
          >
            <LiftlyLogo size={72} />
          </motion.div>
          <h2 className="text-2xl font-black text-foreground">You&apos;re in!</h2>
          <p className="mt-2 text-muted">Taking you to your feed...</p>
        </motion.div>
      </div>
    );
  }

  // ── Email verification pending ──
  if (step === "verify") {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-background px-6 pt-safe">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center w-full max-w-sm"
        >
          <div className="mb-5 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-400/15 border border-sky-400/30">
            <Mail className="h-7 w-7 text-sky-500 dark:text-sky-300" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
          <p className="mt-2 text-[15px] text-muted leading-relaxed">
            We sent a confirmation link to
          </p>
          <p className="mt-1 font-semibold text-sky-500 dark:text-sky-300">{email}</p>
          <p className="mt-4 text-[13px] text-muted leading-relaxed max-w-xs mx-auto">
            Click the link in the email to confirm your account. You&apos;ll be taken back here to finish setting up your profile.
          </p>
          <div className="mt-8 rounded-2xl border bg-surface-1 p-4 text-left">
            <p className="text-[12px] text-muted mb-1 font-semibold uppercase tracking-wider">Having issues?</p>
            <p className="text-[12px] text-muted">Check your spam folder, or{" "}
              <button
                onClick={() => setStep("account")}
                className="text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 font-semibold"
              >
                try a different email
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-background overflow-hidden">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(6,182,212,0.12),transparent)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(6,182,212,0.18),transparent)]" />

      {/* Logo + heading */}
      <div className="pt-top-safe flex flex-col items-center pb-6 relative z-10">
        <Link href="/">
          <LiftlyLogo size={56} animate />
        </Link>
        <h1 className="mt-3 text-xl font-black text-foreground tracking-tight">Liftly</h1>
        <p className="mt-1 text-sm text-muted">
          {step === "account" ? "Create your account" : "Set up your profile"}
        </p>
        {codeVerified && step === "account" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
          >
            <Sparkles className="h-3 w-3" />
            You&apos;re invited
          </motion.div>
        )}

        {/* Step indicator */}
        <div className="mt-4 flex items-center gap-1.5">
          {["account", "profile"].map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={clsx(
                "h-1.5 rounded-full transition-all",
                step === s ? "w-6 bg-sky-500 dark:bg-sky-400" : s === "account" && step === "profile" ? "w-3 bg-sky-400/50 dark:bg-sky-600" : "w-3 bg-foreground/10"
              )} />
            </div>
          ))}
        </div>
      </div>

      {/* Form area - scrollable */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5">
        {/* ── Step 1: Account ── */}
        {step === "account" && (
          <form onSubmit={handleAccountStep} className="space-y-3.5" autoComplete="on">
            <div>
              <label htmlFor="su-invite" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
                Invite Code
              </label>
              {codeVerified ? (
                <div className="flex items-center gap-3 rounded-[14px] border border-emerald-500/25 bg-emerald-500/8 px-4 py-3 text-[14px]">
                  <span className="flex-1 font-mono tracking-wider text-emerald-600 dark:text-emerald-300">{inviteCode}</span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> Verified
                  </span>
                </div>
              ) : (
                <input
                  id="su-invite"
                  type="text"
                  name="invite-code"
                  autoComplete="off"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                  placeholder="e.g. SPARK-RISE-001"
                  maxLength={30}
                  className="w-full rounded-[14px] border bg-[var(--input-bg)] px-4 py-3.5 text-[14px] text-foreground font-mono tracking-wider placeholder:text-muted placeholder:font-sans placeholder:tracking-normal outline-none focus:border-sky-500/50 dark:focus:border-sky-400/50 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.1)] transition-all"
                  required
                />
              )}
            </div>
            <div>
              <label htmlFor="su-email" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
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
                className="w-full rounded-[14px] border bg-[var(--input-bg)] px-4 py-3.5 text-[14px] text-foreground placeholder:text-muted outline-none focus:border-sky-500/50 dark:focus:border-sky-400/50 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.1)] transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="su-pass" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
                Password
              </label>
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
                  className="w-full rounded-[14px] border bg-[var(--input-bg)] px-4 py-3.5 pr-12 text-[14px] text-foreground placeholder:text-muted outline-none focus:border-sky-500/50 dark:focus:border-sky-400/50 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.1)] transition-all"
                  required
                />
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setShowPass((v) => !v);
                  }}
                  className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-muted hover:text-foreground transition-colors z-10 tap-highlight"
                  tabIndex={-1}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="su-confirm-pass" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
                Confirm Password
              </label>
              <div className="relative isolate">
                <input
                  id="su-confirm-pass"
                  type={showConfirmPass ? "text" : "password"}
                  name="confirm-password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  minLength={8}
                  className={clsx(
                    "w-full rounded-[14px] border bg-[var(--input-bg)] px-4 py-3.5 pr-12 text-[14px] text-foreground placeholder:text-muted outline-none transition-all",
                    confirmPassword.length > 0 && password !== confirmPassword
                      ? "border-rose-500/50 focus:border-rose-500/70"
                      : confirmPassword.length > 0 && password === confirmPassword
                      ? "border-emerald-500/40 focus:border-emerald-500/60"
                      : "border focus:border-sky-500/50 dark:focus:border-sky-400/50 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.1)]"
                  )}
                  required
                />
                <button
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); setShowConfirmPass((v) => !v); }}
                  className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-muted hover:text-foreground transition-colors z-10"
                  tabIndex={-1}
                  aria-label={showConfirmPass ? "Hide password" : "Show password"}
                >
                  {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="mt-1 text-[11px] text-rose-500 dark:text-rose-400">Passwords do not match</p>
              )}
              {confirmPassword.length > 0 && password === confirmPassword && (
                <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Check className="h-3 w-3" /> Passwords match</p>
              )}
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-[13px] text-rose-500 dark:text-rose-400">{error}</motion.p>
            )}

            <button
              type="submit"
              disabled={loading || !email || password.length < 8 || password !== confirmPassword || !inviteCode.trim()}
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
              <label htmlFor="su-username" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
                Username
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-[14px] select-none">@</span>
                <input
                  id="su-username"
                  type="text"
                  name="username"
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="yourhandle"
                  maxLength={20}
                  className="w-full rounded-[14px] border bg-[var(--input-bg)] pl-8 pr-4 py-3.5 text-[14px] text-foreground placeholder:text-muted outline-none focus:border-sky-500/50 dark:focus:border-sky-400/50 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.1)] transition-all"
                  required
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted opacity-70">Letters, numbers, underscores only.</p>
            </div>
            <div>
              <label htmlFor="su-displayname" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
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
                className="w-full rounded-[14px] border bg-[var(--input-bg)] px-4 py-3.5 text-[14px] text-foreground placeholder:text-muted outline-none focus:border-sky-500/50 dark:focus:border-sky-400/50 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.1)] transition-all"
                required
              />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-[13px] text-rose-500 dark:text-rose-400">{error}</motion.p>
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

      {/* Bottom links */}
      <div className="relative z-10 px-5 pb-8 pt-4 text-center">
        <p className="text-[13px] text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors">
            Sign in
          </Link>
        </p>
        <p className="mt-2 text-[11px] text-muted opacity-50">
          By joining you agree to our{" "}
          <Link href="/terms" className="underline hover:opacity-80 transition-opacity">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline hover:opacity-80 transition-opacity">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
