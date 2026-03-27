"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, UserMinus } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import Link from "next/link";

type FollowUser = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  vibe_score: number;
  is_following: boolean;
  is_self: boolean;
};

type Props = {
  userId: string;
  type: "followers" | "following";
  isOpen: boolean;
  onClose: () => void;
};

export function FollowersSheet({ userId, type, isOpen, onClose }: Props) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`/api/follows/list?type=${type}&userId=${userId}`)
      .then((r) => r.json())
      .then(({ users }) => setUsers(users ?? []))
      .finally(() => setLoading(false));
  }, [isOpen, userId, type]);

  async function toggleFollow(targetId: string, currentlyFollowing: boolean) {
    setTogglingId(targetId);
    try {
      await fetch("/api/follows", {
        method: currentlyFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: targetId }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, is_following: !currentlyFollowing } : u))
      );
    } finally {
      setTogglingId(null);
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
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-base font-semibold text-foreground capitalize">
                {type} {users.length > 0 && <span className="text-slate-400">({users.length})</span>}
              </h3>
              <button onClick={onClose} className="rounded-full p-1.5 text-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-3 space-y-1">
              {loading ? (
                <div className="py-8 text-center text-slate-500 text-sm">Loading...</div>
              ) : users.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  {type === "followers" ? "No followers yet." : "Not following anyone yet."}
                </div>
              ) : (
                users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 py-2.5">
                    <Link href={`/profile/${u.username}`} onClick={onClose}>
                      <UserAvatar
                        username={u.username}
                        avatarUrl={u.avatar_url}
                        size="sm"
                      />
                    </Link>
                    <Link href={`/profile/${u.username}`} onClick={onClose} className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {u.display_name ?? u.username}
                      </p>
                      <p className="text-xs text-slate-500">@{u.username}</p>
                    </Link>
                    {!u.is_self && (
                      <button
                        onClick={() => toggleFollow(u.id, u.is_following)}
                        disabled={togglingId === u.id}
                        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          u.is_following
                            ? "border border-[var(--border)] text-muted hover:text-foreground hover:border-[var(--border-hover)]"
                            : "bg-sky-500 text-white hover:bg-sky-400"
                        }`}
                      >
                        {u.is_following ? (
                          <><UserMinus className="h-3 w-3" /> Unfollow</>
                        ) : (
                          <><UserPlus className="h-3 w-3" /> Follow</>
                        )}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
