"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { getSupabaseClient } from "@/lib/supabase";

function SignupForm() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<"account" | "profile" | "done">("account");
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

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      setUserId(data.user.id);
      setAccessToken(data.session?.access_token ?? "");
      setStep("profile");
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
      setError(data.error ?? "Failed to create profile");
      setLoading(false);
      return;
    }

    await fetch("/api/streak", { method: "POST" }).catch(() => null);
    setStep("done");
    setTimeout(() => {
      router.push("/feed");
      router.refresh();
    }, 1800);
  }

  if (step === "done") {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-400/20">
          <Check className="h-8 w-8 text-sky-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">You&apos;re in!</h2>
        <p className="mt-2 text-slate-400">Taking you to your feed...</p>
      </motion.div>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <Link href="/" className="text-4xl font-black text-white hover:text-sky-300 transition">
          Liftly
        </Link>
        <p className="mt-2 text-sm text-slate-400">
          {step === "account" ? "Create your account" : "Set up your profile"}
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {["account", "profile"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={clsx(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition",
                step === s || (s === "account" && step === "profile")
                  ? "bg-sky-500 text-white"
                  : "border border-white/20 text-slate-500"
              )}
            >
              {s === "account" && step === "profile" ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i === 0 && <div className={clsx("h-px w-8", step === "profile" ? "bg-sky-500" : "bg-white/10")} />}
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur-xl shadow-2xl shadow-black/40">
        {inviteCode && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/5 px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            <span className="text-xs text-sky-300">Invite code: <strong>{inviteCode}</strong></span>
          </div>
        )}

        {step === "account" && (
          <form onSubmit={handleAccountStep} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-sky-400/50 transition"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  minLength={8}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 pr-10 text-sm text-white placeholder:text-slate-600 outline-none focus:border-sky-400/50 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email || password.length < 8}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3.5 text-sm font-bold text-white transition hover:bg-sky-400 disabled:opacity-50"
            >
              {loading ? "Creating account..." : <>Continue <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        )}

        {step === "profile" && (
          <form onSubmit={handleProfileStep} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="yourhandle"
                  maxLength={20}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 pl-7 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-sky-400/50 transition"
                  required
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Letters, numbers, underscores only.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you want to appear"
                maxLength={40}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-sky-400/50 transition"
                required
              />
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !username || !displayName}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3.5 text-sm font-bold text-white transition hover:bg-sky-400 disabled:opacity-50"
            >
              {loading ? "Setting up..." : <>Join Liftly <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

export default function SignupPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(56,189,248,0.12),transparent)]" />
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="text-slate-400 text-center">Loading...</div>}>
          <SignupForm />
        </Suspense>
      </div>
    </main>
  );
}
