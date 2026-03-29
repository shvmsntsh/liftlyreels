"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, Bell } from "lucide-react";
import Link from "next/link";
import { ReelCard } from "./ReelCard";
import { DailyChallengeBar } from "./DailyChallengeBar";
import { ScrollNudgeCard } from "./ScrollNudgeCard";
import { TourOverlay } from "./TourOverlay";
import { NotificationsSheet } from "./NotificationsSheet";
import { ActionFeedTab } from "./ActionFeedTab";
import { MorningMissionModal } from "./MorningMissionModal";
import { PostRecord, DailyChallenge } from "@/lib/types";
import { WorldReelCard, NewsSlide } from "./WorldReelCard";
import { AnimatePresence } from "framer-motion";
import clsx from "clsx";

type Tab = "foryou" | "following" | "proof";

type Props = {
  initialPosts: PostRecord[];
  userId: string;
  challenge?: DailyChallenge | null;
  streak?: number;
};

export function FeedClient({ initialPosts, userId, challenge }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("foryou");
  const [followingPosts, setFollowingPosts] = useState<PostRecord[] | null>(null);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [personalizedPosts, setPersonalizedPosts] = useState<PostRecord[] | null>(null);
  const [loadingPersonalized, setLoadingPersonalized] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loggedCount, setLoggedCount] = useState(0);
  const [worldReel, setWorldReel] = useState<NewsSlide[] | null>(null);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);

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

  // Check daily proof limit on mount
  useEffect(() => {
    fetch("/api/impact?dailyCount=true")
      .then((r) => r.json())
      .then((data) => setDailyLimitReached((data.count ?? 0) >= 5))
      .catch(() => null);
  }, []);

  // Fetch personalized feed when For You tab is active
  useEffect(() => {
    if (tab !== "foryou" || personalizedPosts !== null || loadingPersonalized) return;
    setLoadingPersonalized(true);
    fetch("/api/feed/personalized")
      .then((r) => r.json())
      .then((data) => {
        // Fall back to initialPosts if personalized feed returns < 5 posts
        if (data.posts?.length >= 5) {
          setPersonalizedPosts(data.posts);
        } else {
          setPersonalizedPosts(null);
        }
      })
      .catch(() => setPersonalizedPosts(null))
      .finally(() => setLoadingPersonalized(false));
  }, [tab, personalizedPosts, loadingPersonalized]);

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

  async function handleActionLogged(dailyCount: number) {
    setLoggedCount((n) => n + 1);
    // Set daily limit reached when at 5 proofs
    if (dailyCount >= 5) {
      setDailyLimitReached(true);
    }
    // Unlock world reel on 5th proof of the day (and every 5th after)
    if (dailyCount > 0 && dailyCount % 5 === 0) {
      const today = new Date().toISOString().slice(0, 10);
      const seenKey = `liftly-world-reel-${today}-${dailyCount}`;
      if (localStorage.getItem(seenKey)) return; // Already shown for this milestone today
      localStorage.setItem(seenKey, "1");
      try {
        const res = await fetch("/api/news-reel");
        const data = await res.json();
        if (data.slides?.length > 0) setWorldReel(data.slides);
      } catch {
        /* fail silently */
      }
    }
  }

  function handleTabChange(t: Tab) {
    setTab(t);
    if (t === "following") loadFollowing();
  }

  const activePosts = tab === "foryou"
    ? (personalizedPosts ?? initialPosts)
    : (followingPosts ?? []);
  const isReelTab = tab === "foryou" || tab === "following";

  const tabLabels: { key: Tab; label: string }[] = [
    { key: "foryou", label: "For You" },
    { key: "following", label: "Following" },
    { key: "proof", label: "Proof" },
  ];

  return (
    <div ref={scrollRef} className={clsx("h-[100dvh] scrollbar-none", isReelTab ? "overflow-y-auto snap-y-mandatory feed-scroll" : "overflow-y-auto")}>
      <TourOverlay />
      <MorningMissionModal challengeText={challenge?.challenge_text ?? null} />
      {/* Header with tabs, search, and notifications */}
      <div className="snap-start sticky top-0 z-30 flex items-center justify-center gap-2 pt-4 pb-2 px-4 bg-transparent pointer-events-none">
        <div className="pointer-events-auto flex gap-0.5 rounded-full border border-white/10 bg-black/40 px-1 py-1 backdrop-blur-md">
          {tabLabels.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={clsx(
                "rounded-full px-3 py-1.5 text-xs font-bold transition tap-highlight",
                tab === key
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              {label}
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

      {/* Proof feed tab */}
      {tab === "proof" && (
        <div className="mx-auto max-w-md min-h-screen pb-28">
          <ActionFeedTab />
        </div>
      )}

      {/* Reel tabs content */}
      {isReelTab && (
        <>
          {/* Daily challenge (for you tab only) */}
          {tab === "foryou" && challenge && (
            <div className="snap-start relative flex h-[100dvh] items-center justify-center overflow-hidden px-4 py-8">
              <DailyChallengeBar challenge={challenge} fullPage />
            </div>
          )}

          {loadingFollowing ? (
            <div className="snap-start flex h-[100dvh] items-center justify-center">
              <motion.div
                className="h-8 w-8 rounded-full border-2 border-white/40 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : (
            <>
              {activePosts.map((post, index) => (
                <React.Fragment key={post.id}>
                  <ReelCard
                    post={post}
                    userId={userId}
                    onActionLogged={handleActionLogged}
                    dailyLimitReached={dailyLimitReached}
                  />
                  {(index + 1) % 5 === 0 && (index + 1) < activePosts.length && (
                    <ScrollNudgeCard
                      count={index + 1}
                      actionsLogged={loggedCount}
                      onScrollBack={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
                    />
                  )}
                </React.Fragment>
              ))}

              {activePosts.length === 0 && (
                <div className="snap-start flex h-[100dvh] items-center justify-center">
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
        </>
      )}

      <NotificationsSheet
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadChange={setUnreadCount}
      />

      {/* World Reel overlay — unlocked after 5 proofs in a day */}
      <AnimatePresence>
        {worldReel && (
          <WorldReelCard
            slides={worldReel}
            onDismiss={() => setWorldReel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
