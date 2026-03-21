"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Flame, Zap, BookOpen, LogOut, Camera, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProfileRecord, PostRecord, REEL_GRADIENTS } from "@/lib/types";
import { UserAvatar, DEFAULT_AVATARS } from "./UserAvatar";
import { getSupabaseClient } from "@/lib/supabase";
import clsx from "clsx";

// Changelog entries — update this with each deploy
const CHANGELOG = [
  {
    version: "v1.4",
    date: "Mar 21, 2026",
    entries: [
      "Follow creators directly from reels",
      "Profile picture picker with 12 default avatars",
      "Cleaner reel content — single elegant subtitle",
      "Fixed invite codes not working across users",
      "Fixed audio not playing on reels",
      "Improved bottom navigation — bigger tap targets",
      "Added What's New section to profile",
    ],
  },
  {
    version: "v1.3",
    date: "Mar 19, 2026",
    entries: [
      "Dark-only design overhaul",
      "Audio system for category-based reel music",
      "Landing page redesign",
      "Fixed API route issues",
    ],
  },
  {
    version: "v1.2",
    date: "Mar 18, 2026",
    entries: [
      "Session sync fixes for auth",
      "Signup flow improvements",
      "Mobile UI polish and Safari fixes",
    ],
  },
];

type Props = {
  profile: ProfileRecord;
  posts: PostRecord[];
  isOwnProfile: boolean;
  currentUserId?: string;
  impactEntries: Array<{ id: string; post_id: string; action_taken: string; created_at: string }>;
  inviteCodes: Array<{ code: string; used_by: string | null; created_at: string }>;
};

type Tab = "reels" | "impact" | "invite" | "updates";

export function ProfileClient({
  profile,
  posts,
  isOwnProfile,
  currentUserId,
  impactEntries,
  inviteCodes,
}: Props) {
  const [following, setFollowing] = useState(profile.is_following ?? false);
  const [followerCount, setFollowerCount] = useState(profile.followers_count ?? 0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("reels");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(profile.avatar_url);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const router = useRouter();

  async function toggleFollow() {
    if (!currentUserId || isOwnProfile) return;
    const prev = following;
    setFollowing(!prev);
    setFollowerCount((c) => c + (prev ? -1 : 1));

    await fetch("/api/follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: profile.id }),
    }).catch(() => {
      setFollowing(prev);
      setFollowerCount((c) => c + (prev ? 1 : -1));
    });
  }

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase?.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  async function selectAvatar(avatarId: string) {
    setSavingAvatar(true);
    setCurrentAvatar(avatarId);
    try {
      // Try client-side first, then API fallback
      const supabase = getSupabaseClient();
      let success = false;
      if (supabase) {
        const { error } = await supabase
          .from("profiles")
          .update({ avatar_url: avatarId })
          .eq("id", profile.id);
        success = !error;
      }
      if (!success) {
        await fetch("/api/profile/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl: avatarId }),
        });
      }
      setShowAvatarPicker(false);
      router.refresh();
    } catch {
      setCurrentAvatar(profile.avatar_url);
    }
    setSavingAvatar(false);
  }

  const vibeLevel =
    profile.vibe_score >= 500
      ? { label: "Legend", color: "text-amber-300", bg: "bg-amber-400/10 border-amber-400/20" }
      : profile.vibe_score >= 200
      ? { label: "Pro", color: "text-violet-300", bg: "bg-violet-400/10 border-violet-400/20" }
      : profile.vibe_score >= 50
      ? { label: "Rising", color: "text-sky-300", bg: "bg-sky-400/10 border-sky-400/20" }
      : { label: "Newcomer", color: "text-slate-300", bg: "bg-slate-400/10 border-slate-400/20" };

  const ownTabs: Tab[] = ["reels", "impact", "invite", "updates"];
  const otherTabs: Tab[] = ["reels"];

  return (
    <div>
      {/* Header bg gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(56,189,248,0.12),transparent)]" />

      <div className="relative mx-auto max-w-md px-4 pt-10">
        {/* Top actions */}
        {isOwnProfile && (
          <div className="flex justify-end mb-4">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        )}

        {/* Avatar + name */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <UserAvatar
              username={profile.username}
              avatarUrl={currentAvatar}
              size="lg"
            />
            {isOwnProfile && (
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 border-2 border-[var(--background)] text-white shadow-lg"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">
                {profile.display_name ?? profile.username}
              </h1>
              <span
                className={clsx(
                  "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  vibeLevel.bg,
                  vibeLevel.color
                )}
              >
                {vibeLevel.label}
              </span>
            </div>
            <p className="text-sm text-muted">@{profile.username}</p>
            {profile.bio && (
              <p className="mt-1.5 text-sm text-slate-300 leading-5">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Avatar picker */}
        <AnimatePresence>
          {showAvatarPicker && isOwnProfile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-2xl border p-4"
                style={{ borderColor: "var(--card-border)", background: "var(--surface-1)" }}>
                <p className="text-xs font-semibold text-slate-400 mb-3">Choose your avatar</p>
                <div className="grid grid-cols-6 gap-2.5">
                  {DEFAULT_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => selectAvatar(avatar.id)}
                      disabled={savingAvatar}
                      className={clsx(
                        "flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br transition-all",
                        avatar.gradient,
                        currentAvatar === avatar.id
                          ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-[var(--background)] scale-110"
                          : "hover:scale-105 opacity-80 hover:opacity-100"
                      )}
                    >
                      <span className="text-xl">{avatar.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            { label: "Reels", value: profile.posts_count ?? 0 },
            { label: "Followers", value: followerCount },
            { label: "Following", value: profile.following_count ?? 0 },
            { label: "Vibe", value: profile.vibe_score },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border p-2 text-center"
              style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
              <div className="text-base font-bold text-foreground">{value}</div>
              <div className="text-[10px] text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Streak */}
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-orange-400/15 bg-orange-950/20 px-4 py-2.5">
          <Flame className="h-4 w-4 text-orange-400 fill-current" />
          <div className="flex-1">
            <div className="text-sm font-bold text-foreground">
              {profile.streak_current} day streak
            </div>
            <div className="text-[11px] text-slate-500">
              Longest: {profile.streak_longest} days
            </div>
          </div>
          <div className="text-xl">
            {profile.streak_current >= 30
              ? "\u{1F3C6}"
              : profile.streak_current >= 14
              ? "\u{1F48E}"
              : profile.streak_current >= 7
              ? "\u{1F525}"
              : profile.streak_current >= 3
              ? "\u{26A1}"
              : "\u{1F331}"}
          </div>
        </div>

        {/* Follow button (not own profile) */}
        {!isOwnProfile && currentUserId && (
          <button
            onClick={toggleFollow}
            className={clsx(
              "mt-4 w-full rounded-xl py-3 text-sm font-bold transition",
              following
                ? "border border-white/20 bg-transparent text-white hover:bg-white/5"
                : "bg-sky-500 text-white hover:bg-sky-400"
            )}
          >
            {following ? "Following" : "Follow"}
          </button>
        )}

        {/* Tabs */}
        <div className="mt-6 flex border-b border-white/10">
          {(isOwnProfile ? ownTabs : otherTabs).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "flex-1 pb-2 text-xs font-semibold uppercase tracking-wider transition",
                activeTab === tab
                  ? "border-b-2 border-sky-400 text-sky-300"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {tab === "reels" && <><BookOpen className="inline h-3.5 w-3.5 mr-1" />Reels</>}
              {tab === "impact" && <><Zap className="inline h-3.5 w-3.5 mr-1" />Impact</>}
              {tab === "invite" && <><span className="mr-1">{"\u{1F39F}"}</span>Invite</>}
              {tab === "updates" && <><Sparkles className="inline h-3.5 w-3.5 mr-1" />New</>}
            </button>
          ))}
        </div>

        {/* Reels tab */}
        {activeTab === "reels" && (
          <div className="mt-4 grid grid-cols-2 gap-3 pb-6">
            {posts.map((post) => {
              const g = REEL_GRADIENTS[post.gradient ?? "ocean"] ?? REEL_GRADIENTS.ocean;
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl"
                  style={{
                    aspectRatio: "3/4",
                    background: post.image_url
                      ? `url(${post.image_url}) center/cover`
                      : `linear-gradient(135deg, ${g.from}, ${g.to})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-sky-300">
                      {post.category}
                    </span>
                    <p className="text-xs font-bold text-white line-clamp-2 leading-4">
                      {post.title}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            {posts.length === 0 && (
              <div className="col-span-2 py-10 text-center text-slate-500 text-sm">
                No reels yet.
              </div>
            )}
          </div>
        )}

        {/* Impact tab */}
        {activeTab === "impact" && (
          <div className="mt-4 space-y-3 pb-6">
            <p className="text-sm text-muted">
              Actions you&apos;ve logged from reels — your real-world growth.
            </p>
            {impactEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-amber-400/15 bg-amber-950/20 p-3"
              >
                <p className="text-sm text-slate-200">{entry.action_taken}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {new Date(entry.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            ))}
            {impactEntries.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-sm">
                No impact logged yet. Tap {"\u{1F4D3}"} on any reel to log your first action.
              </div>
            )}
          </div>
        )}

        {/* Invite codes tab */}
        {activeTab === "invite" && (
          <div className="mt-4 space-y-3 pb-6">
            <div className="rounded-xl border border-sky-400/15 bg-sky-950/20 p-3 mb-4">
              <p className="text-xs font-semibold text-sky-300 mb-1">Your invite code</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-foreground">{profile.invite_code ?? "\u{2014}"}</span>
                {profile.invite_code && (
                  <button
                    onClick={() => copyCode(profile.invite_code!)}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedCode === profile.invite_code ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Share this with people you want to invite.
              </p>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Extra invite codes ({inviteCodes.length} available)
            </p>
            {inviteCodes.map((ic) => (
              <div
                key={ic.code}
                className="flex items-center justify-between rounded-xl border px-3 py-2.5"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
              >
                <span className="font-mono text-sm text-foreground">{ic.code}</span>
                <button
                  onClick={() => copyCode(ic.code)}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedCode === ic.code ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
            {inviteCodes.length === 0 && (
              <div className="py-6 text-center text-slate-500 text-sm">
                No invite codes available right now.
              </div>
            )}
          </div>
        )}

        {/* Updates / Changelog tab */}
        {activeTab === "updates" && (
          <div className="mt-4 space-y-4 pb-6">
            {CHANGELOG.map((release) => (
              <div key={release.version} className="rounded-xl border p-4"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="rounded-full bg-sky-500/15 border border-sky-400/20 px-2 py-0.5 text-[11px] font-bold text-sky-300">
                    {release.version}
                  </span>
                  <span className="text-[11px] text-slate-500">{release.date}</span>
                </div>
                <ul className="space-y-1.5">
                  {release.entries.map((entry, i) => (
                    <li key={i} className="flex gap-2 text-[13px] text-slate-300 leading-5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/60" />
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
