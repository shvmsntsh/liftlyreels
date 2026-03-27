"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

function ProfileSetupForm() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const inviteCode = searchParams.get("code") ?? "";

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase!.auth.getSession();
    const accessToken = session?.access_token ?? "";
    const uid = userId || session?.user?.id || "";

    if (!uid) {
      setError("Session expired. Please sign up again.");
      setLoading(false);
      return;
    }

    // Get invite code from URL params, user metadata, or ask user
    const code = inviteCode || session?.user?.user_metadata?.invite_code || "";
    if (!code) {
      setError("Missing invite code. Please sign up again with an invite code.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: uid,
        accessToken,
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        inviteCode: code,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      setError(data.error ?? "Failed to create profile");
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => { router.push("/feed"); }, 1500);
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20">
          <Check className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">You&apos;re in!</h2>
        <p className="mt-2 text-slate-400">Taking you to your feed...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-foreground">Liftly</h1>
        <p className="mt-2 text-[13px] text-slate-500">Email confirmed! Set up your profile.</p>
      </div>

      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-1)] p-6 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">Username</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[14px]">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="yourhandle"
                maxLength={20}
                className="w-full rounded-[14px] border border-[var(--border)] bg-[var(--input-bg)] pl-8 pr-4 py-3.5 text-[14px] text-foreground placeholder:text-muted outline-none focus:border-sky-400/50 transition-all"
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How you want to appear"
              maxLength={40}
              className="w-full rounded-[14px] border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3.5 text-[14px] text-foreground placeholder:text-muted outline-none focus:border-sky-400/50 transition-all"
              required
            />
          </div>
          {error && <p className="text-[13px] text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || username.length < 2 || !displayName}
            className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-sky-500 to-blue-600 py-4 text-[14px] font-bold text-white shadow-[0_4px_20px_rgba(56,189,248,0.3)] disabled:opacity-50 tap-highlight"
          >
            {loading ? "Setting up..." : <>Join Liftly <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
      </div>
    </>
  );
}

export default function ProfileSetupPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="text-slate-400 text-center">Loading...</div>}>
          <ProfileSetupForm />
        </Suspense>
      </div>
    </main>
  );
}
