"use client";

import { useEffect, useState } from "react";
import { UserAvatar } from "./UserAvatar";

type UserRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  vibe_score: number;
  streak_current: number;
  is_blocked: boolean;
  created_at: string;
};

export function AdminUsersClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function toggleBlock(userId: string, block: boolean) {
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: block ? "block" : "unblock" }),
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_blocked: block } : u))
    );
  }

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Users ({users.length})</h1>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search users..."
        className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none"
        style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}
      />

      {loading ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>Loading...</p>
      ) : (
        <div className="space-y-1">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
            >
              <UserAvatar username={u.username} avatarUrl={u.avatar_url} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {u.display_name ?? u.username}
                  {u.is_blocked && (
                    <span className="ml-2 text-[10px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-full">
                      BLOCKED
                    </span>
                  )}
                </p>
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                  @{u.username} · Vibe: {u.vibe_score} · Streak: {u.streak_current}
                </p>
              </div>
              <button
                onClick={() => toggleBlock(u.id, !u.is_blocked)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                  u.is_blocked
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-400/20"
                    : "bg-red-500/15 text-red-400 border border-red-400/20"
                }`}
              >
                {u.is_blocked ? "Unblock" : "Block"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
