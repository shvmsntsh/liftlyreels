"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Flame, Bookmark, MessageCircle, UserPlus, NotebookPen, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "./UserAvatar";

type Notification = {
  id: string;
  type: "comment" | "reaction" | "impact" | "follow";
  post_id: string | null;
  reaction_type: string | null;
  read: boolean;
  created_at: string;
  actor: { username: string; display_name: string | null; avatar_url: string | null };
  post: { title: string; gradient: string | null; image_url: string | null } | null;
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function notificationText(n: Notification): string {
  const name = n.actor.display_name ?? n.actor.username;
  switch (n.type) {
    case "comment":
      return `${name} commented on your reel`;
    case "reaction":
      if (n.reaction_type === "sparked") return `${name} sparked your reel ⚡`;
      if (n.reaction_type === "fired_up") return `${name} fired up your reel 🔥`;
      if (n.reaction_type === "bookmarked") return `${name} saved your reel`;
      return `${name} reacted to your reel`;
    case "impact":
      return `${name} logged an impact from your reel`;
    case "follow":
      return `${name} started following you`;
  }
}

function NotificationIcon({ type, reactionType }: { type: string; reactionType: string | null }) {
  const cls = "h-4 w-4";
  if (type === "comment") return <MessageCircle className={cls} />;
  if (type === "follow") return <UserPlus className={cls} />;
  if (type === "impact") return <NotebookPen className={cls} />;
  if (reactionType === "sparked") return <Zap className={cls} />;
  if (reactionType === "fired_up") return <Flame className={cls} />;
  if (reactionType === "bookmarked") return <Bookmark className={cls} />;
  return <Bell className={cls} />;
}

function iconBg(type: string, reactionType: string | null): string {
  if (type === "comment") return "bg-sky-500/20 text-sky-400";
  if (type === "follow") return "bg-violet-500/20 text-violet-400";
  if (type === "impact") return "bg-emerald-500/20 text-emerald-400";
  if (reactionType === "sparked") return "bg-amber-500/20 text-amber-400";
  if (reactionType === "fired_up") return "bg-orange-500/20 text-orange-400";
  if (reactionType === "bookmarked") return "bg-sky-500/20 text-sky-400";
  return "bg-white/10 text-white/60";
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
};

export function NotificationsSheet({ isOpen, onClose, onUnreadChange }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
        onUnreadChange?.(0);
        // Mark all as read
        fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [isOpen]);

  function handleNotificationTap(n: Notification) {
    onClose();
    if (n.type === "follow") {
      router.push(`/profile/${n.actor.username}`);
    } else if (n.post_id) {
      router.push(`/feed#${n.post_id}`);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[105] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[110] mx-auto max-w-md rounded-t-3xl backdrop-blur-xl"
            style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-sky-400" />
                Activity
              </h3>
              <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-4 py-3 space-y-1">
              {loading ? (
                <div className="py-10 text-center text-slate-500 text-sm">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="mx-auto h-8 w-8 text-slate-600 mb-3" />
                  <p className="text-slate-500 text-sm">No activity yet.</p>
                  <p className="text-slate-600 text-xs mt-1">When people react, comment, or follow you, it shows up here.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationTap(n)}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/5 tap-highlight"
                    style={!n.read ? { backgroundColor: "rgba(56,189,248,0.05)" } : undefined}
                  >
                    {/* Actor avatar */}
                    <div className="relative shrink-0">
                      <UserAvatar
                        username={n.actor.username}
                        avatarUrl={n.actor.avatar_url}
                        size="sm"
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full ${iconBg(n.type, n.reaction_type)}`}
                      >
                        <NotificationIcon type={n.type} reactionType={n.reaction_type} />
                      </div>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${n.read ? "text-slate-300" : "text-white font-medium"}`}>
                        {notificationText(n)}
                      </p>
                      {n.post?.title && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{n.post.title}</p>
                      )}
                    </div>

                    {/* Time + unread dot */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-slate-600">{timeAgo(n.created_at)}</span>
                      {!n.read && (
                        <div className="h-2 w-2 rounded-full bg-sky-400" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
