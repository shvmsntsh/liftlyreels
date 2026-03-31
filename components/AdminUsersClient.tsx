"use client";

import { useEffect, useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
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
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [passwordsByUser, setPasswordsByUser] = useState<Record<string, string>>({});
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function toggleBlock(userId: string, block: boolean) {
    setBusyUserId(userId);
    setError(null);
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: block ? "block" : "unblock" }),
    }).finally(() => setBusyUserId(null));
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_blocked: block } : u))
    );
  }

  async function resetPassword(userId: string) {
    setBusyUserId(userId);
    setCopiedUserId(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "reset_password" }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Failed to reset password");
        return;
      }

      setPasswordsByUser((prev) => ({
        ...prev,
        [userId]: data.temporaryPassword ?? "",
      }));
    } catch {
      setError("Failed to reset password");
    } finally {
      setBusyUserId(null);
    }
  }

  async function copyPassword(userId: string) {
    const password = passwordsByUser[userId];
    if (!password) return;

    try {
      await navigator.clipboard.writeText(password);
      setCopiedUserId(userId);
      setTimeout(() => setCopiedUserId((current) => (current === userId ? null : current)), 2000);
    } catch {
      setError("Could not copy password");
    }
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

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm text-red-300"
          style={{ backgroundColor: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(248, 113, 113, 0.22)" }}
        >
          {error}
        </div>
      )}

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
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
            >
              <div className="flex items-center gap-3">
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
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => resetPassword(u.id)}
                    disabled={busyUserId === u.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-500/15 px-3 py-1.5 text-[11px] font-bold text-amber-300 transition disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {busyUserId === u.id ? "Resetting..." : "Reset Password"}
                  </button>
                  <button
                    onClick={() => toggleBlock(u.id, !u.is_blocked)}
                    disabled={busyUserId === u.id}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition disabled:opacity-50 ${
                      u.is_blocked
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-400/20"
                        : "bg-red-500/15 text-red-400 border border-red-400/20"
                    }`}
                  >
                    {u.is_blocked ? "Unblock" : "Block"}
                  </button>
                </div>
              </div>

              {passwordsByUser[u.id] && (
                <div
                  className="mt-3 rounded-xl px-3 py-3"
                  style={{ backgroundColor: "rgba(245, 158, 11, 0.09)", border: "1px solid rgba(251, 191, 36, 0.18)" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-300/90">
                        Temporary password
                      </p>
                      <p className="mt-1 break-all font-mono text-sm text-white">
                        {passwordsByUser[u.id]}
                      </p>
                    </div>
                    <button
                      onClick={() => copyPassword(u.id)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-white/10"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copiedUserId === u.id ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px]" style={{ color: "var(--muted)" }}>
                    Copy this once and send it to the user manually. It is not shown again automatically.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
