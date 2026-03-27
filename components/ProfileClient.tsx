"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Flame, Zap, BookOpen, LogOut, Camera, Sparkles, Settings, Pencil, X, ImagePlus, Loader2, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProfileRecord, PostRecord, REEL_GRADIENTS, getStreakRank } from "@/lib/types";
import { UserAvatar, DEFAULT_AVATARS } from "./UserAvatar";
import { FollowersSheet } from "./FollowersSheet";
import { StreakSheet } from "./StreakSheet";
import { NotificationsSheet } from "./NotificationsSheet";
import { getSupabaseClient } from "@/lib/supabase";
import clsx from "clsx";

// Changelog entries — update this with each deploy
const CHANGELOG = [
  {
    version: "v1.6",
    date: "Mar 23, 2026",
    entries: [
      "Activity notifications — see who sparked, commented, or followed you",
      "Notification bell in feed header and profile with unread badge",
      "Tap notifications to jump directly to the relevant reel",
      "Engagement loop — every reaction, comment, follow, and impact awards vibe and streak",
      "Post owners earn vibe when others interact with their reels",
      "Fixed comments (Talk) — now works reliably on all devices",
    ],
  },
  {
    version: "v1.5",
    date: "Mar 22, 2026",
    entries: [
      "Fixed audio playback on all reels (iOS Safari compatible)",
      "Fixed comments (Talk) not loading or posting",
      "Added confirm password field on signup",
      "Streaks now update daily when visiting feed",
      "Challenge system overhaul — daily auto-generated challenges",
      "Badge progress system (Rookie to Legend)",
      "Streak ranks (Warrior, Champion, Legend, Immortal)",
      "How to Play card for challenge newcomers",
      "First-time user tour with step-by-step walkthrough",
      "Clickable profile stats — view followers, following, streak details",
      "Curated audio and background picker for reel creation",
      "Design polish with gradient banners and glass-morphism",
    ],
  },
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

type EditingPost = { id: string; title: string; content: string[]; category: string; tags: string[]; gradient: string };

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
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState(profile.bio ?? "");
  const [bioSaving, setBioSaving] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);
  const [editingPost, setEditingPost] = useState<EditingPost | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localPosts, setLocalPosts] = useState<PostRecord[]>(posts);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [followSheet, setFollowSheet] = useState<"followers" | "following" | null>(null);
  const [showStreakSheet, setShowStreakSheet] = useState(false);
  const [showNotifSheet, setShowNotifSheet] = useState(false);
  const [notifUnread, setNotifUnread] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  function shareInviteLink(code: string) {
    const url = `${window.location.origin}/signup?code=${encodeURIComponent(code)}`;
    if (navigator.share) {
      navigator.share({ title: "Join me on Liftly!", text: `Use my invite code to join Liftly: ${code}`, url }).catch(() => {
        navigator.clipboard.writeText(url);
        setCopiedCode(`link:${code}`);
        setTimeout(() => setCopiedCode(null), 2000);
      });
    } else {
      navigator.clipboard.writeText(url);
      setCopiedCode(`link:${code}`);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  }

  async function savePost() {
    if (!editingPost) return;
    setEditSaving(true);
    try {
      await fetch("/api/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPost),
      });
      setLocalPosts((prev) =>
        prev.map((p) => (p.id === editingPost.id ? { ...p, ...editingPost } : p))
      );
      setEditingPost(null);
    } finally {
      setEditSaving(false);
    }
  }

  async function deletePost(id: string) {
    setDeletingId(id);
    try {
      await fetch("/api/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setLocalPosts((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirmId(null);
    } finally {
      setDeletingId(null);
    }
  }

  async function saveBio() {
    setBioSaving(true);
    try {
      await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioValue }),
      });
      setBioSaved(true);
      setEditingBio(false);
      setTimeout(() => setBioSaved(false), 2000);
      router.refresh();
    } finally {
      setBioSaving(false);
    }
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

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("File too large. Maximum 5 MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setUploadError("Use JPEG, PNG, WebP, or GIF.");
      return;
    }

    setUploadingPhoto(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/avatar/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed");
        return;
      }

      setCurrentAvatar(data.url);
      setShowAvatarPicker(false);
      router.refresh();
    } catch {
      setUploadError("Upload failed. Try again.");
    } finally {
      setUploadingPhoto(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
      {/* Gradient cover banner */}
      <div className="relative h-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-600/40 via-purple-600/30 to-blue-900/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] to-transparent" />
        {/* Top actions overlaying banner */}
        {isOwnProfile && (
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <button
              onClick={() => setShowNotifSheet(true)}
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/30 backdrop-blur-md text-white/70 transition hover:text-white hover:bg-black/50"
            >
              <Bell className="h-3.5 w-3.5" />
              {notifUnread > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-bold leading-none text-white">
                  {notifUnread > 9 ? "9+" : notifUnread}
                </span>
              )}
            </button>
            <Link
              href="/settings"
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 backdrop-blur-md px-3 py-1.5 text-xs text-white/70 transition hover:text-white hover:bg-black/50"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 backdrop-blur-md px-3 py-1.5 text-xs text-white/70 transition hover:text-white hover:bg-black/50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        )}
      </div>

      <div className="relative mx-auto max-w-md px-4 -mt-10">

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
            {/* Bio display + inline edit */}
            {isOwnProfile ? (
              <div className="mt-1.5">
                {editingBio ? (
                  <div className="flex flex-col gap-1.5">
                    <textarea
                      value={bioValue}
                      onChange={(e) => setBioValue(e.target.value.slice(0, 200))}
                      rows={2}
                      maxLength={200}
                      placeholder="Tell people what you're about..."
                      className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-[var(--accent)]/40"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveBio}
                        disabled={bioSaving}
                        className="flex-1 rounded-lg bg-[var(--accent)] py-1.5 text-xs font-bold text-[var(--on-accent)] transition"
                      >
                        {bioSaving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => { setEditingBio(false); setBioValue(profile.bio ?? ""); }}
                        className="flex items-center justify-center rounded-lg border border-[var(--border)] px-3 py-1.5"
                      >
                        <X className="h-3.5 w-3.5 text-muted" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingBio(true)}
                    className="flex items-start gap-1.5 text-left"
                  >
                    {bioValue ? (
                      <span className="text-sm text-muted leading-5">{bioValue}</span>
                    ) : (
                      <span className="text-sm text-muted/40 italic">Add a bio…</span>
                    )}
                    <Pencil className="mt-0.5 h-3 w-3 shrink-0 text-muted/50" />
                  </button>
                )}
                {bioSaved && <p className="mt-1 text-xs text-emerald-400">Bio saved!</p>}
              </div>
            ) : (
              profile.bio && <p className="mt-1.5 text-sm text-muted leading-5">{profile.bio}</p>
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
                <p className="text-xs font-semibold text-muted mb-3">Choose your avatar</p>

                {/* Upload from gallery */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto || savingAvatar}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--accent)]/30 bg-[var(--accent-soft)] py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent-soft)] hover:border-[var(--accent)]/50 disabled:opacity-50"
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-4 w-4" />
                      Upload from gallery
                    </>
                  )}
                </button>
                {uploadError && (
                  <p className="mb-2 text-xs text-red-400">{uploadError}</p>
                )}

                <p className="text-[10px] text-muted mb-2">Or pick a preset</p>
                <div className="grid grid-cols-6 gap-2.5">
                  {DEFAULT_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => selectAvatar(avatar.id)}
                      disabled={savingAvatar || uploadingPhoto}
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

        {/* Stats row — clickable */}
        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            { label: "Reels", value: profile.posts_count ?? 0, onClick: undefined },
            { label: "Followers", value: followerCount, onClick: () => setFollowSheet("followers") },
            { label: "Following", value: profile.following_count ?? 0, onClick: () => setFollowSheet("following") },
            { label: "Vibe", value: profile.vibe_score, onClick: undefined },
          ].map(({ label, value, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              disabled={!onClick}
              className="rounded-xl p-2 text-center transition tap-highlight disabled:cursor-default hover:bg-white/8 backdrop-blur-xl"
              style={{ border: "1px solid var(--border)", background: "var(--glass-bg)" }}
            >
              <div className="text-base font-bold text-foreground">{value}</div>
              <div className="text-[10px] text-slate-500">{label}</div>
            </button>
          ))}
        </div>

        {/* Streak — clickable */}
        <button
          onClick={() => setShowStreakSheet(true)}
          className="mt-3 flex w-full items-center gap-3 rounded-xl border border-orange-400/15 bg-orange-950/20 px-4 py-2.5 text-left transition tap-highlight hover:bg-orange-950/30"
        >
          <Flame className="h-4 w-4 text-orange-400 fill-current" />
          <div className="flex-1">
            <div className="text-sm font-bold text-foreground">
              {profile.streak_current} {profile.streak_current === 1 ? "day" : "days"} streak
            </div>
            <div className="text-[11px] text-slate-500">
              {getStreakRank(profile.streak_current).icon} {getStreakRank(profile.streak_current).name} · Longest: {Math.max(profile.streak_current, profile.streak_longest ?? 0)} {Math.max(profile.streak_current, profile.streak_longest ?? 0) === 1 ? "day" : "days"}
            </div>
          </div>
          <div className="text-xl">
            {getStreakRank(profile.streak_current).icon}
          </div>
        </button>

        {/* Follow button (not own profile) */}
        {!isOwnProfile && currentUserId && (
          <button
            onClick={toggleFollow}
            className={clsx(
              "mt-4 w-full rounded-xl py-3 text-sm font-bold transition",
              following
                ? "border border-[var(--border)] bg-transparent text-foreground hover:bg-[var(--surface-2)]"
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
          <>
            {/* Edit post modal */}
            <AnimatePresence>
              {editingPost && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 backdrop-blur-sm"
                  onClick={(e) => e.target === e.currentTarget && setEditingPost(null)}
                >
                  <motion.div
                    initial={{ y: 40 }}
                    animate={{ y: 0 }}
                    exit={{ y: 40 }}
                    className="w-full max-w-md rounded-t-3xl border-t border-[var(--border)] bg-[var(--surface-1)] p-5 pb-safe overflow-y-auto max-h-[85vh]"
                  >
                    <h3 className="mb-4 text-sm font-bold text-foreground">Edit Reel</h3>
                    <div className="space-y-3">
                      <input
                        value={editingPost.title}
                        onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                        maxLength={80}
                        placeholder="Title"
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-[var(--accent)]/40"
                      />
                      <textarea
                        value={editingPost.content.join("\n")}
                        onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value.split("\n").filter(Boolean) })}
                        rows={4}
                        placeholder="One bullet per line"
                        className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-[var(--accent)]/40"
                      />
                      <input
                        value={editingPost.tags.join(", ")}
                        onChange={(e) => setEditingPost({ ...editingPost, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                        placeholder="Tags (comma-separated)"
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-[var(--accent)]/40"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={savePost}
                          disabled={editSaving}
                          className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-bold text-[var(--on-accent)] transition hover:brightness-110 disabled:opacity-50"
                        >
                          {editSaving ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingPost(null)}
                          className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Delete confirm modal */}
            <AnimatePresence>
              {deleteConfirmId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                  onClick={(e) => e.target === e.currentTarget && setDeleteConfirmId(null)}
                >
                  <motion.div
                    initial={{ scale: 0.92 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.92 }}
                    className="w-full max-w-xs rounded-3xl border border-[var(--border)] bg-[var(--surface-1)] p-6 text-center"
                  >
                    <p className="text-2xl mb-2">🗑️</p>
                    <p className="text-sm font-bold text-foreground mb-1">Delete this reel?</p>
                    <p className="text-xs text-muted mb-5">This can&apos;t be undone.</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm text-muted"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => deletePost(deleteConfirmId)}
                        disabled={!!deletingId}
                        className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white transition hover:bg-red-400 disabled:opacity-50"
                      >
                        {deletingId ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 grid grid-cols-2 gap-3 pb-6">
              {localPosts.map((post) => {
                const g = REEL_GRADIENTS[post.gradient ?? "ocean"] ?? REEL_GRADIENTS.ocean;
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative overflow-hidden rounded-2xl cursor-pointer"
                    style={{
                      aspectRatio: "3/4",
                      background: post.image_url
                        ? `url(${post.image_url}) center/cover`
                        : `linear-gradient(135deg, ${g.from}, ${g.to})`,
                    }}
                    onClick={() => router.push(`/feed?post=${post.id}`)}
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
                    {/* Edit/delete actions for own posts */}
                    {isOwnProfile && (
                      <div className="absolute inset-x-0 top-0 flex justify-end gap-1.5 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingPost({
                            id: post.id,
                            title: post.title,
                            content: post.content,
                            category: post.category,
                            tags: post.tags,
                            gradient: post.gradient,
                          }); }}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(post.id); }}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-rose-400 backdrop-blur-sm"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
              {localPosts.length === 0 && (
                <div className="col-span-2 py-10 text-center text-slate-500 text-sm">
                  No reels yet.
                </div>
              )}
            </div>
          </>
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
            <div className="rounded-xl border border-sky-400/15 bg-sky-950/20 p-4 mb-4">
              <p className="text-xs font-semibold text-sky-300 mb-2">Your invite code</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-lg font-bold text-foreground tracking-wider">{profile.invite_code ?? "\u{2014}"}</span>
                {profile.invite_code && (
                  <button
                    onClick={() => copyCode(profile.invite_code!)}
                    className="text-muted hover:text-foreground"
                  >
                    {copiedCode === profile.invite_code ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
              {profile.invite_code && (
                <button
                  onClick={() => shareInviteLink(profile.invite_code!)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-xs font-bold text-white transition hover:bg-sky-400"
                >
                  {copiedCode === `link:${profile.invite_code}` ? (
                    <><Check className="h-3.5 w-3.5" /> Link copied!</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> Share invite link</>
                  )}
                </button>
              )}
              <p className="mt-2 text-[11px] text-slate-500">
                Share the code or link — they&apos;ll enter it when signing up.
              </p>
            </div>

            {inviteCodes.length > 0 && (
              <>
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => shareInviteLink(ic.code)}
                        className="text-sky-400 hover:text-sky-300 text-[11px] font-semibold"
                      >
                        {copiedCode === `link:${ic.code}` ? "Copied!" : "Share"}
                      </button>
                      <button
                        onClick={() => copyCode(ic.code)}
                        className="text-muted hover:text-foreground"
                      >
                        {copiedCode === ic.code ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
            {inviteCodes.length === 0 && (
              <div className="py-4 text-center text-slate-500 text-sm">
                Your invite codes will appear here once generated.
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

      {/* Followers/Following Sheet */}
      <FollowersSheet
        userId={profile.id}
        type={followSheet ?? "followers"}
        isOpen={followSheet !== null}
        onClose={() => setFollowSheet(null)}
      />

      {/* Streak Details Sheet */}
      <StreakSheet
        isOpen={showStreakSheet}
        onClose={() => setShowStreakSheet(false)}
        currentStreak={profile.streak_current}
        longestStreak={Math.max(profile.streak_current, profile.streak_longest ?? 0)}
        lastActive={profile.streak_last_active}
      />

      {/* Notifications Sheet */}
      <NotificationsSheet
        isOpen={showNotifSheet}
        onClose={() => setShowNotifSheet(false)}
        onUnreadChange={setNotifUnread}
      />
    </div>
  );
}
