"use client";

import { useState, useRef, useEffect } from "react";
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
import { BUILD_VERSION } from "@/lib/version";
import { StreakDefenseBanner } from "./StreakDefenseBanner";

// Changelog entries — update this with each deploy
const CHANGELOG = [
  {
    version: "v1.20",
    date: "Mar 29, 2026",
    entries: [
      "Content Collector: daily auto-collection from Guardian + Reddit with images",
      "Admin Dashboard: user management, content moderation, manual collection trigger",
      "Proof Hardening: 90s cooldown, category-specific validation, anti-gibberish",
      "Fixed: update popup no longer loops on every deploy",
      "How to Play card: now collapsible (expand/collapse/dismiss)",
      "Light mode: fixed all broken colors across challenge page and leaderboard",
    ],
  },
  {
    version: "v1.19",
    date: "Mar 28, 2026",
    entries: [
      "World Reel: real article images with fallback chain, clean text rendering",
      "Fixed: all content visible above bottom nav (native iOS tab bar positioning)",
      "Fixed: sound button no longer overlaps close button in World Reel",
      "Audio: Settings page and feed audio now properly synced",
      "Reaction buttons: clean circular highlight instead of boxy background",
      "Proved reels persist across reloads — no duplicate proofs or points",
      "Build timestamp auto-generated in IST at deploy time",
      "Bottom nav flush to screen edge like native iOS app",
    ],
  },
  {
    version: "v1.18",
    date: "Mar 28, 2026",
    entries: [
      "Instagram-style splash screen with animated logo on every app load",
      "Fixed: 'I Did This' button fully visible above bottom nav on all iOS devices",
      "Fixed: 'Go prove it' scroll-to-top now scrolls correctly in the feed",
      "World Reel: actual news article images via og:image fallback",
      "What's New popup auto-shows once on every new deployment",
      "iOS viewport fix: dynamic viewport height (100dvh) on all full-screen cards",
    ],
  },
  {
    version: "v1.16",
    date: "Mar 28, 2026",
    entries: [
      "World Reel — unlocked after 5 proofs in a day: top 10 global news as a full-screen Instagram-style reel",
      "11 slides: dramatic intro + 1 news story per category (Tech, Business, World, Science, Sport...)",
      "News sourced from The Guardian (last 24 hours, auto-refreshed every 4 hours)",
      "Category order personalized based on your most-logged proof categories",
      "Reel disappears after viewing — won't show again until next milestone",
      "Cached in Supabase — one generation shared across all users",
    ],
  },
  {
    version: "v1.15",
    date: "Mar 27, 2026",
    entries: [
      "Proof Vault — profile proof tab rebuilt as trophy case with stats + styled cards",
      "Category accent colors on every proof card (Gym, Books, Mindset, etc.)",
      "Stats bar on own profile: total proofs, days active, top category",
      "Social proof on share links — avatar stack + proof count on /r/[id] pages",
      "Dynamic CTA on share links: 'Join X people who actually did this →'",
      "Logged-in users can prove directly from share link without going to feed",
      "Streak Defense Banner — shows after 4pm when streak is at risk",
    ],
  },
  {
    version: "v1.14",
    date: "Mar 28, 2026",
    entries: [
      "Light & dark mode across landing, login, signup — fully theme-aware",
      "Full-screen layout with viewport-fit:cover — content behind status bar",
      "Status bar now blends seamlessly with app background",
      "LiftlyLogo redesigned — consistent across all screens with animated glow",
      "Landing page redesigned to single screen (no scroll needed)",
      "Signup cleaned up — confirm password field, lucide eye toggle icons",
    ],
  },
  {
    version: "v1.13",
    date: "Mar 27, 2026",
    entries: [
      "Action logging fixed — impact now saves reliably (removed broken FK join)",
      "Quick-tap logging — tap a template to log instantly, no submit button needed",
      "Confetti + haptic feedback every time you log an action",
      "Motivational messages after logging — different one each time",
      "Success animation: ring pulse, star burst, +3 Vibe badge",
      "ScrollNudge now tracks real logged actions — shows encouragement if you've proved things",
      "I Did This button pulses with a glow to draw attention",
      "Haptic feedback on all reactions, follow, and key taps",
    ],
  },
  {
    version: "v1.12",
    date: "Mar 27, 2026",
    entries: [
      "New Liftly logo — consistent emerald→sky branding across all screens",
      "Login & Signup redesigned as full-screen mobile-app layouts (no card wrappers)",
      "Animated logo draw-in on signup completion",
      "Terms and Privacy footer links on all auth screens",
    ],
  },
  {
    version: "v1.11",
    date: "Mar 27, 2026",
    entries: [
      "Commitment Chains — start a 7, 30, or 75-day personal challenge",
      "Choose a goal from presets or write your own, mark daily progress",
      "Chain breaks detection — missed yesterday? Start fresh",
      "Proof tab visible on other users' profiles — see what they've done",
      "Weekly activity tracker on profile — 7-dot view of active days",
      "Impact entries now fetched for all profiles (public social proof)",
    ],
  },
  {
    version: "v1.10",
    date: "Mar 27, 2026",
    entries: [
      "Public reel pages at /r/{id} — share any reel without needing an account",
      "Share button now copies public link — works on iOS, Android, desktop",
      "Open Graph meta tags on public reels for rich social media previews",
      "7-Day Chain Tracker on challenge page — visual streak ring for current week",
      "Non-users see full reel content + \"I Did This — Join Liftly\" CTA",
    ],
  },
  {
    version: "v1.9",
    date: "Mar 27, 2026",
    entries: [
      "Proof tab in feed — see what people you follow have actually done",
      "Morning Mission modal — set your daily intention when you open the app",
      "Streak milestone celebrations — hit 3/7/14/30 days and get a celebration",
      "Actions API returns streak info for real-time milestone detection",
      "Fixed TypeScript type errors in landing page animations",
    ],
  },
  {
    version: "v1.8",
    date: "Mar 27, 2026",
    entries: [
      "New identity: Stop Scrolling. Start Proving. — app-wide messaging overhaul",
      "Animated landing page with Liftly logo mark (checkmark-arrow + emerald glow)",
      "\"I Did This\" hero button on every reel — full-width, impossible to miss",
      "Quick-action template pills — tap to pre-fill your proof log by category",
      "Scroll Nudge Card — after 5 passive reels, prompted to go prove something",
      "Action proof is now text-only — fast to log, optimized for MVP",
      "\"Act\" tab in bottom nav replaces \"Challenge\" — clearer call to action",
    ],
  },
  {
    version: "v1.7",
    date: "Mar 27, 2026",
    entries: [
      "Full light mode — every screen adapts to system theme",
      "Fixed streak 'Longest' display showing 0 when streak is active",
      "Fixed reel posting stuck on 'Posting...' — network errors now surface correctly",
      "Fixed comments input hidden behind iPhone keyboard — sheet lifts above keyboard",
      "Fixed audio unlock race condition — sound now plays reliably on iOS",
      "iOS comments: tap 'Send' on keyboard to post without needing to reach the button",
    ],
  },
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
  const [activeTab, setActiveTab] = useState<Tab>(isOwnProfile ? "impact" : "reels");
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
  const [lazyImpact, setLazyImpact] = useState<Array<{
    id: string; post_id: string; action_taken: string; created_at: string;
    post: { title: string; category: string; gradient: string } | null;
  }> | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (activeTab !== "impact" || lazyImpact !== null || impactLoading) return;
    setImpactLoading(true);
    fetch("/api/impact?range=30d")
      .then((r) => r.json())
      .then((d) => { setLazyImpact(d.entries ?? []); })
      .catch(() => { setLazyImpact([]); })
      .finally(() => setImpactLoading(false));
  }, [activeTab, lazyImpact, impactLoading]);

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
      const res = await fetch("/api/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        alert("Failed to delete post");
        return;
      }
      setLocalPosts((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirmId(null);
      router.refresh();
    } catch (err) {
      alert("Error deleting post");
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
  const otherTabs: Tab[] = ["reels", "impact"];

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
        <div className="mt-5 grid grid-cols-5 gap-1.5">
          {[
            { label: "Actions", value: impactEntries.length, onClick: () => setActiveTab("impact") },
            { label: "Reels", value: profile.posts_count ?? 0, onClick: () => setActiveTab("reels") },
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

        {/* Weekly Activity (own profile only) */}
        {isOwnProfile && (() => {
          const today = new Date();
          const dayOfWeek = today.getDay(); // 0=Sun
          const monday = new Date(today);
          monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
          const weekDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d.toISOString().slice(0, 10);
          });
          const activeDays = new Set(impactEntries.map((e) => e.created_at.slice(0, 10)));
          const doneThisWeek = weekDays.filter((d) => activeDays.has(d)).length;
          const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
          const todayStr = today.toISOString().slice(0, 10);
          return (
            <div className="mt-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">This Week</p>
                <p className="text-[11px] text-emerald-400 font-bold">{doneThisWeek}/7 active days</p>
              </div>
              <div className="flex items-center justify-between">
                {weekDays.map((d, i) => {
                  const active = activeDays.has(d);
                  const isToday = d === todayStr;
                  return (
                    <div key={d} className="flex flex-col items-center gap-1">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        active
                          ? "bg-emerald-400 text-black shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                          : isToday
                          ? "border border-slate-500 text-slate-500"
                          : "bg-white/5 text-slate-700"
                      }`}>
                        {active ? "✓" : ""}
                      </div>
                      <span className={`text-[9px] ${isToday ? "text-slate-400 font-bold" : "text-slate-700"}`}>{dayLabels[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

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

        {/* Streak defense banner — own profile only */}
        {isOwnProfile && <StreakDefenseBanner streak={profile.streak_current} />}

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
              {tab === "impact" && <><Camera className="inline h-3.5 w-3.5 mr-1" />Proof</>}
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

        {/* Proof tab */}
        {activeTab === "impact" && (() => {
          const CATEGORY_COLORS: Record<string, string> = {
            Gym: "#10b981", Books: "#0ea5e9", Diet: "#22c55e",
            Mindset: "#f59e0b", Wellness: "#14b8a6", Finance: "#8b5cf6", Relationships: "#ec4899",
          };
          function relTime(iso: string) {
            const diff = Date.now() - new Date(iso).getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 60) return `${Math.max(1, mins)}m ago`;
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return `${hrs}h ago`;
            const days = Math.floor(hrs / 24);
            if (days < 7) return `${days}d ago`;
            return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          }
          const entries = lazyImpact ?? [];
          const totalProofs = entries.length;
          const daysActive = new Set(entries.map((e) => e.created_at.slice(0, 10))).size;
          const catFreq: Record<string, number> = {};
          for (const e of entries) { if (e.post?.category) catFreq[e.post.category] = (catFreq[e.post.category] ?? 0) + 1; }
          const favCat = Object.entries(catFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

          // Get today's proofs
          const today = new Date().toISOString().slice(0, 10);
          const todayProofs = entries.filter((e) => e.created_at.slice(0, 10) === today);

          return (
            <div className="mt-4 pb-8">
              {/* Today's Proves section — own profile only */}
              {isOwnProfile && todayProofs.length > 0 && (
                <div className="mb-4 rounded-2xl border bg-surface-1 p-4">
                  <p className="text-sm font-bold text-foreground mb-3">Today's Proves ({todayProofs.length}/5)</p>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${(todayProofs.length / 5) * 100}%` }} />
                  </div>
                  <div className="space-y-2">
                    {todayProofs.map((entry) => {
                      const cat = entry.post?.category ?? "";
                      const color = CATEGORY_COLORS[cat] ?? "#64748b";
                      return (
                        <div key={entry.id} className="flex gap-2 items-start p-2 rounded-lg bg-white/5">
                          <div className="w-1 h-full rounded mt-0.5" style={{ background: color, minHeight: "24px" }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-muted truncate">{entry.post?.title ?? "Action"}</p>
                            <p className="text-[10px] text-white/60 line-clamp-1 mt-0.5">{entry.action_taken}</p>
                            <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/70 mt-1">{cat}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stats bar — own profile only */}
              {isOwnProfile && (
                <div className="mb-5 grid grid-cols-3 gap-2">
                  {[
                    { label: "Proofs Logged", value: impactLoading ? "—" : String(totalProofs) },
                    { label: "Days Active", value: impactLoading ? "—" : String(daysActive) },
                    { label: "Top Category", value: impactLoading ? "—" : (favCat ?? "—") },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col items-center rounded-2xl border bg-surface-1 px-2 py-3 text-center">
                      <span className="text-[18px] font-black text-foreground tabular-nums">{value}</span>
                      <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">{label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 30-day heatmap — own profile only */}
              {isOwnProfile && (
                <div className="mb-5 rounded-2xl border bg-surface-1 p-4">
                  <p className="text-sm font-bold text-foreground mb-3">Proof Activity (30 days)</p>
                  {(() => {
                    const today = new Date();
                    const days = Array.from({ length: 30 }, (_, i) => {
                      const d = new Date(today);
                      d.setDate(today.getDate() - 29 + i);
                      return d.toISOString().slice(0, 10);
                    });
                    const proofsByDay: Record<string, number> = {};
                    for (const e of entries) {
                      const day = e.created_at.slice(0, 10);
                      proofsByDay[day] = (proofsByDay[day] ?? 0) + 1;
                    }
                    const intensityClass = (count: number) => {
                      if (count === 0) return "bg-white/5 border border-white/10";
                      if (count === 1) return "bg-emerald-900/60";
                      if (count <= 2) return "bg-emerald-700/70";
                      if (count <= 4) return "bg-emerald-600/80";
                      return "bg-emerald-500";
                    };
                    return (
                      <div className="grid grid-cols-5 gap-1.5">
                        {days.map((day, idx) => (
                          <div key={day} className="flex flex-col items-center">
                            {idx % 5 === 0 && <span className="text-[8px] text-muted mb-1">{new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                            <div className={clsx("w-6 h-6 rounded-sm transition-all cursor-default", intensityClass(proofsByDay[day] ?? 0))} title={`${proofsByDay[day] ?? 0} proofs on ${day}`} />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Loading skeleton */}
              {impactLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-1" />
                  ))}
                </div>
              )}

              {/* Proof cards */}
              {!impactLoading && entries.length > 0 && (
                <div className="space-y-3">
                  {entries.map((entry) => {
                    const cat = entry.post?.category ?? "";
                    const color = CATEGORY_COLORS[cat] ?? "#64748b";
                    const title = entry.post?.title ?? "Personal action";
                    return (
                      <div key={entry.id} className="flex overflow-hidden rounded-2xl border bg-surface-1">
                        {/* Left accent bar */}
                        <div className="w-1 flex-shrink-0 rounded-l-2xl" style={{ background: color }} />
                        <div className="flex-1 px-3.5 py-3">
                          <p className="text-[11px] font-semibold text-muted line-clamp-1 mb-1">{title}</p>
                          <p className="text-[13px] font-medium text-foreground leading-snug">
                            <span className="text-muted mr-1 select-none">&ldquo;</span>
                            {entry.action_taken}
                            <span className="text-muted ml-1 select-none">&rdquo;</span>
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            {cat && (
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                style={{ background: `${color}22`, color }}
                              >
                                {cat}
                              </span>
                            )}
                            <span className="text-[10px] text-muted">{relTime(entry.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty state */}
              {!impactLoading && entries.length === 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="mb-3 text-4xl">🏆</div>
                  <p className="text-[15px] font-bold text-foreground">Your proof record starts here</p>
                  <p className="mt-1 max-w-[220px] text-[12px] text-muted leading-relaxed">
                    Every reel you act on gets logged here. Your permanent trophy case.
                  </p>
                  <Link
                    href="/feed"
                    className="mt-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-[13px] font-bold text-white"
                  >
                    Go prove something →
                  </Link>
                </div>
              )}
            </div>
          );
        })()}

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
            {CHANGELOG.map((release, idx) => (
              <div key={release.version} className="rounded-xl border p-4"
                style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="rounded-full bg-sky-500/15 border border-sky-400/20 px-2 py-0.5 text-[11px] font-bold text-sky-300">
                    {release.version}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {idx === 0 ? BUILD_VERSION.split("·")[1]?.trim() ?? release.date : release.date}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {release.entries.map((entry, i) => (
                    <li key={i} className="flex gap-2 text-[13px] text-slate-300 leading-5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/60" />
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
                {idx === 0 && (
                  <p className="mt-2.5 text-[9px] text-slate-600 tabular-nums">Build: {BUILD_VERSION}</p>
                )}
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
