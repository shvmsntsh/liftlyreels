"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Dumbbell, Brain, Flame, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

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
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        {/* Logo + tagline */}
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tight">Liftly</h1>
          <p className="mt-2 text-[15px] font-medium text-[var(--muted)]">
            Positive reels that change your life.
          </p>
        </div>

        {/* Category icons row */}
        <div className="mt-8 flex justify-center gap-5">
          {[
            { icon: Brain, label: "Mindset" },
            { icon: Dumbbell, label: "Gym" },
            { icon: BookOpen, label: "Books" },
            { icon: Flame, label: "Diet" },
            { icon: Shield, label: "Wellness" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
                <Icon className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.8} />
              </div>
              <span className="text-[10px] font-medium text-[var(--muted)]">{label}</span>
            </div>
          ))}
        </div>

        {/* Invite card */}
        <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-sm font-bold">Enter invite code</h2>
          </div>
          <p className="mb-4 text-xs text-[var(--muted)]">
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
                "w-full rounded-xl border bg-[var(--background)] px-4 py-3 text-center font-mono text-sm font-semibold placeholder:font-sans placeholder:font-normal placeholder:text-[var(--muted)]/50 outline-none transition-all",
                status === "error"
                  ? "border-red-500/50 focus:border-red-500/50"
                  : "border-[var(--line)] focus:border-[var(--accent)]/50"
              )}
              autoCapitalize="characters"
              spellCheck={false}
            />

            {status === "error" && (
              <p className="text-center text-xs text-red-500">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={!code.trim() || status === "checking"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3.5 text-sm font-bold text-white transition-opacity disabled:opacity-40"
            >
              {status === "checking" ? (
                "Checking..."
              ) : (
                <>
                  Join Liftly
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-xs text-[var(--muted)]">Already have an account? </span>
            <Link href="/login" className="text-xs font-semibold text-[var(--accent)]">
              Sign in
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-[var(--muted)]/50">
          No ads &middot; No toxicity &middot; Invitation only
        </p>
      </div>
    </main>
  );
}
