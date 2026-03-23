"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Bell } from "lucide-react";
import Link from "next/link";
import { ReelCard } from "./ReelCard";
import { DailyChallengeBar } from "./DailyChallengeBar";
import { TourOverlay } from "./TourOverlay";
import { NotificationsSheet } from "./NotificationsSheet";
import { PostRecord, DailyChallenge } from "@/lib/types";
import clsx from "clsx";

type Tab = "foryou" | "following";

type Props = {
  initialPosts: PostRecord[];
  userId: string;
  challenge?: DailyChallenge | null;
};

export function FeedClient({ initialPosts, userId, challenge }: Props) {
  const [tab, setTab] = useState<Tab>("foryou");
  const [followingPosts, setFollowingPosts] = useState<PostRecord[] | null>(null);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Update streak once per day when user visits feed
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastStreakDate = localStorage.getItem("liftly-streak-date");
    if (lastStreakDate === today) return;
    localStorage.setItem("liftly-streak-date", today);
    fetch("/api/streak", { method: "POST" }).catch(() => null);
  }, []);

  // Fetch unread notification count on mount
  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setUnreadCount(data.unreadCount ?? 0))
      .catch(() => null);
  }, []);

  async function loadFollowing() {
    if (followingPosts !== null) return;
    setLoadingFollowing(true);
    try {
      const res = await fetch("/api/posts/following");
      const data = await res.json();
      setFollowingPosts(data.posts ?? []);
    } catch {
      setFollowingPosts([]);
    } finally {
      setLoadingFollowing(false);
    }
  }

  function handleTabChange(t: Tab) {
    setTab(t);
    if (t === "following") loadFollowing();
  }

  const activePosts = tab === "foryou" ? initialPosts : (followingPosts ?? []);

  return (
    <div className="h-screen overflow-y-auto snap-y-mandatory scrollbar-none feed-scroll">
      <TourOverlay />
      {/* Header with tabs, search, and notifications */}
      <div className="snap-start sticky top-0 z-30 flex items-center justify-center gap-2 pt-4 pb-2 px-4 bg-transparent pointer-events-none">
        <div className="pointer-events-auto flex gap-1 rounded-full border border-white/10 bg-black/40 px-1 py-1 backdrop-blur-md">
          {(["foryou", "following"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={clsx(
                "rounded-full px-4 py-1.5 text-xs font-bold transition tap-highlight",
                tab === t
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              {t === "foryou" ? "For You" : "Following"}
            </button>
          ))}
        </div>
        <Link
          href="/search"
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur-md"
        >
          <Search className="h-3.5 w-3.5 text-white/70" />
        </Link>
        <button
          onClick={() => setNotifOpen(true)}
          className="pointer-events-auto relative flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur-md"
        >
          <Bell className="h-3.5 w-3.5 text-white/70" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-bold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Daily challenge (for you tab only) */}
      {tab === "foryou" && challenge && (
        <div className="snap-start relative flex h-screen items-center justify-center overflow-hidden px-4 py-8">
          <DailyChallengeBar challenge={challenge} fullPage />
        </div>
      )}

      {/* Posts */}
      {loadingFollowing ? (
        <div className="snap-start flex h-screen items-center justify-center">
          <motion.div
            className="h-8 w-8 rounded-full border-2 border-white/40 border-t-white"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        </div>
      ) : (
        <>
          {activePosts.map((post) => (
            <ReelCard key={post.id} post={post} userId={userId} />
          ))}

          {activePosts.length === 0 && (
            <div className="snap-start flex h-screen items-center justify-center">
              <div className="text-center px-8">
                {tab === "following" ? (
                  <>
                    <p className="text-lg font-semibold text-white">No posts yet</p>
                    <p className="mt-2 text-sm text-white/50">
                      Follow creators to see their reels here
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-white">No reels yet</p>
                    <p className="mt-2 text-sm text-white/50">Be the first to create one!</p>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <NotificationsSheet
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadChange={setUnreadCount}
      />
    </div>
  );
}
