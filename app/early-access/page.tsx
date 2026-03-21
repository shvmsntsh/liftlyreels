"use client";

import { useState } from "react";
import { Shield, Zap, Trophy, Bug, Star, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import clsx from "clsx";

const PERKS = [
  {
    icon: Shield,
    color: "text-amber-300",
    bg: "bg-amber-400/10 border-amber-400/20",
    badge: "🏛️ Founding Member",
    title: "Permanent Founder Badge",
    desc: "Your profile shows the exclusive Founding Member badge — forever. No one else ever gets this after the first 100.",
    tier: "founder",
  },
  {
    icon: Zap,
    color: "text-sky-300",
    bg: "bg-sky-400/10 border-sky-400/20",
    badge: "10x Invite Codes",
    title: "10 Invite Codes (vs 3)",
    desc: "As an early tester you get 10 invite codes to share with friends. Standard users get 3.",
    tier: "all",
  },
  {
    icon: Trophy,
    color: "text-violet-300",
    bg: "bg-violet-400/10 border-violet-400/20",
    badge: "Founding Pro",
    title: "Free Premium — For Life",
    desc: "First 100 users get Liftly Pro free for life. Unlimited reels, advanced analytics, custom themes.",
    tier: "founder",
  },
  {
    icon: Bug,
    color: "text-emerald-300",
    bg: "bg-emerald-400/10 border-emerald-400/20",
    badge: "🐛 Bug Crusher",
    title: "Bug Bounty Rewards",
    desc: "Report a valid bug, earn the Bug Crusher badge + 50 Vibe. Critical bugs get a shoutout in the app.",
    tier: "all",
  },
  {
    icon: Star,
    color: "text-rose-300",
    bg: "bg-rose-400/10 border-rose-400/20",
    badge: "Featured",
    title: "Founders Wall",
    desc: "Your username appears in the Founders Wall inside the app — visible to every future user.",
    tier: "founder",
  },
];

const PREMIUM_FEATURES = [
  { icon: "🎨", title: "Custom profile themes", free: false },
  { icon: "📊", title: "Advanced analytics (who sparked you)", free: false },
  { icon: "♾️", title: "Unlimited reels per day", free: false },
  { icon: "🔮", title: "Early access to new features", free: false },
  { icon: "🌊", title: "Ripple Tree visualization", free: false },
  { icon: "📅", title: "Weekly Wisdom digest email", free: false },
  { icon: "🎟", title: "10 invite codes (vs 3)", free: false },
  { icon: "🔥", title: "Streak streaks (protect a miss)", free: false },
  { icon: "📓", title: "Impact Journal", free: true },
  { icon: "⚡", title: "Spark / Fired Up reactions", free: true },
  { icon: "🏆", title: "Daily challenges", free: true },
  { icon: "🎬", title: "Create reels", free: true },
];

const NOVEL_IDEAS = [
  {
    emoji: "🌊",
    title: "Ripple Effect",
    desc: "See your invite tree. Track the collective Vibe Score of everyone you brought to Liftly. Watch your positive impact multiply.",
  },
  {
    emoji: "🔮",
    title: "Blindspot Reel",
    desc: "Once a day, get served ONE reel from a category you've never engaged with. Designed to expand your horizon beyond your comfort zone.",
  },
  {
    emoji: "⏱️",
    title: "Momentum Mode",
    desc: "Set your ideal viewing window (e.g., 7-8am). App serves morning content then. Encourages intentional consumption, not doom-scrolling.",
  },
  {
    emoji: "📓",
    title: "Impact Journal",
    desc: "Log real actions you took because of a reel. 24h later, get nudged: 'Did you act on this?' Track your actual growth, not just your views.",
  },
  {
    emoji: "🧑‍🤝‍🧑",
    title: "Accountability Twin",
    desc: "System matches you with someone with similar interests but opposite strengths. Weekly nudges about each other's progress.",
  },
  {
    emoji: "📚",
    title: "Knowledge Chains",
    desc: "Finish a book reel? Get auto-served the next chapter-reel in that chain. Like a curriculum that builds over weeks.",
  },
  {
    emoji: "⏰",
    title: "Micro Commitments",
    desc: "When bookmarking, set a 24h or 7-day reminder. 'Remind me to act on this.' Your reels become personal tasks.",
  },
  {
    emoji: "😌",
    title: "Gratitude Glitch",
    desc: "Every Sunday, a full-screen takeover: 3 questions. What worked? What will I change? Who inspired me? Private journal only you see.",
  },
  {
    emoji: "📊",
    title: "Compound Growth Chart",
    desc: "Your profile shows a personal growth chart — Vibe Score, streak, and impact entries over time. Like a stock chart for your mindset.",
  },
  {
    emoji: "💫",
    title: "Vibe Drops",
    desc: "Limited time badges unlock during specific windows (7am, 12pm, 7pm). Rewards showing up at positive times of day.",
  },
  {
    emoji: "🤝",
    title: "Creator Challenges",
    desc: "Top creators can set reel challenges with deadlines. 'Best discipline tip by Friday — winner gets featured on Explore.'",
  },
  {
    emoji: "🌍",
    title: "NASA + Science Reels",
    desc: "Live feed from NASA, space discoveries, breakthrough science — all turned into 30-second perspective shifts. The universe is your hype crew.",
  },
];

export default function EarlyAccessPage() {
  const [bugTitle, setBugTitle] = useState("");
  const [bugDesc, setBugDesc] = useState("");
  const [bugSeverity, setBugSeverity] = useState("low");
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [bugSubmitted, setBugSubmitted] = useState(false);

  async function submitBug(e: React.FormEvent) {
    e.preventDefault();
    if (!bugTitle || !bugDesc) return;
    setBugSubmitting(true);
    try {
      await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: bugTitle, description: bugDesc, severity: bugSeverity }),
      });
      setBugSubmitted(true);
    } finally {
      setBugSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-background pb-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_0%,rgba(245,158,11,0.1),transparent)]" />

      <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--nav-bg)] px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏛️</span>
            <h1 className="text-lg font-bold text-foreground">Early Access</h1>
          </div>
          <p className="text-xs text-amber-400">Founding member perks &amp; what&apos;s coming</p>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-8 px-4 pt-6">
        {/* Hero */}
        <div className="rounded-3xl border border-amber-400/20 bg-gradient-to-b from-amber-950/40 to-[var(--background)] p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-2xl">🏛️</span>
            <div>
              <p className="text-lg font-black text-foreground">You&apos;re a Founding Member</p>
              <p className="text-xs text-amber-400">First 100 users on Liftly</p>
            </div>
          </div>
          <p className="text-sm text-muted leading-5">
            You&apos;re here at the very beginning. That means permanent perks, unlimited invites, and a forever badge. Thank you for being part of building this.
          </p>
        </div>

        {/* Perks */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
            Your Founding Perks
          </p>
          <div className="space-y-3">
            {PERKS.map(({ icon: Icon, color, bg, badge, title, desc }) => (
              <div key={title} className={clsx("rounded-2xl border p-4", bg)}>
                <div className="mb-2 flex items-center gap-2">
                  <Icon className={clsx("h-4 w-4", color)} />
                  <span className={clsx("text-xs font-bold", color)}>{badge}</span>
                </div>
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
                <p className="mt-1 text-xs text-muted leading-4">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Free vs Pro */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
          <div className="grid grid-cols-3 border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-bold uppercase tracking-wider">
            <span className="text-muted">Feature</span>
            <span className="text-center text-muted">Free</span>
            <span className="text-center text-sky-300">Pro</span>
          </div>
          {PREMIUM_FEATURES.map(({ icon, title, free }) => (
            <div key={title} className="grid grid-cols-3 border-b border-[var(--card-border)] px-3 py-2.5">
              <span className="text-xs text-foreground">
                {icon} {title}
              </span>
              <div className="flex justify-center">
                {free ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <span className="text-muted">—</span>
                )}
              </div>
              <div className="flex justify-center">
                <Check className="h-4 w-4 text-sky-400" />
              </div>
            </div>
          ))}
          <div className="p-3">
            <button className="w-full rounded-xl bg-sky-500 py-2.5 text-xs font-bold text-white hover:bg-sky-400 transition">
              Upgrade to Pro — Coming Soon
            </button>
          </div>
        </div>

        {/* 12 Unique Ideas */}
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">
            12 Never-Done-Before Features
          </p>
          <p className="mb-4 text-xs text-muted opacity-60">Built into Liftly — or coming soon</p>
          <div className="grid grid-cols-2 gap-3">
            {NOVEL_IDEAS.map(({ emoji, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-3"
              >
                <div className="mb-1.5 text-xl">{emoji}</div>
                <h3 className="text-xs font-bold text-foreground">{title}</h3>
                <p className="mt-0.5 text-[10px] leading-[1.4] text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Partnership section */}
        <div className="rounded-2xl border border-violet-400/20 bg-violet-950/20 p-4">
          <h3 className="mb-2 text-sm font-bold text-foreground">🤝 Partnerships</h3>
          <p className="text-xs text-muted leading-5 mb-3">
            We&apos;re building integrations with the best tools for growth:
          </p>
          <div className="space-y-2">
            {[
              { name: "Apple Health / Google Fit", status: "In Development", icon: "🍎" },
              { name: "Blinkist / Book Summary APIs", status: "Planned", icon: "📖" },
              { name: "Corporate Wellness Packages", status: "Available", icon: "🏢" },
              { name: "Podcast RSS feeds", status: "Planned", icon: "🎧" },
              { name: "Spotify (mood-based playlists)", status: "Exploring", icon: "🎵" },
            ].map(({ name, status, icon }) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-xs text-foreground">
                  {icon} {name}
                </span>
                <span
                  className={clsx(
                    "text-[10px] font-semibold",
                    status === "Available"
                      ? "text-emerald-400"
                      : status === "In Development"
                      ? "text-amber-400"
                      : "text-muted"
                  )}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bug Report Form */}
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-950/20 p-4">
          <h3 className="mb-1 text-sm font-bold text-foreground">🐛 Report a Bug</h3>
          <p className="mb-3 text-xs text-muted">
            Get +5 Vibe + Bug Crusher badge for valid reports.
          </p>
          {bugSubmitted ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20 px-3 py-2">
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-emerald-300">Bug reported! +5 Vibe incoming.</span>
            </div>
          ) : (
            <form onSubmit={submitBug} className="space-y-3">
              <input
                type="text"
                value={bugTitle}
                onChange={(e) => setBugTitle(e.target.value)}
                placeholder="Brief title..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-emerald-400/40"
                required
              />
              <textarea
                value={bugDesc}
                onChange={(e) => setBugDesc(e.target.value)}
                placeholder="Steps to reproduce, what you expected vs. what happened..."
                rows={3}
                className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-emerald-400/40"
                required
              />
              <div className="flex gap-2">
                {["low", "medium", "high"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setBugSeverity(s)}
                    className={clsx(
                      "flex-1 rounded-lg border py-1.5 text-xs font-semibold transition capitalize",
                      bugSeverity === s
                        ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-300"
                        : "border-[var(--border)] text-muted"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={bugSubmitting || !bugTitle || !bugDesc}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-40"
              >
                {bugSubmitting ? "Submitting..." : "Submit Bug Report"}
              </button>
            </form>
          )}
        </div>

        {/* Share CTA */}
        <div className="rounded-2xl border border-sky-400/20 bg-sky-950/20 p-4 text-center">
          <p className="text-sm font-bold text-foreground mb-1">Help grow the community</p>
          <p className="text-xs text-muted mb-3">
            Share your invite code with people who are serious about growth.
          </p>
          <Link
            href="/profile/me"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-400"
          >
            View My Invite Codes <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
