"use client";

import { useEffect, useState } from "react";
import { Trash2, Edit3, Check, X } from "lucide-react";

type PostRow = {
  id: string;
  title: string;
  category: string;
  source: string;
  is_user_created: boolean;
  created_at: string;
  reported?: boolean;
};

type PostAnalytics = {
  post: { id: string; title: string; views_count: number; cached_engagement_score: number };
  reactions: { sparked: number; fired_up: number; bookmarked: number };
  proofCount: number;
  commentCount: number;
  reportCount: number;
};

export function AdminContentClient() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "reported" | "collected">("all");
  const [analyticsPostId, setAnalyticsPostId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<PostAnalytics | null>(null);

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(postId: string) {
    if (!confirm("Delete this post permanently?")) return;
    setError(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) {
        setError(`Delete failed: ${res.status}`);
        return;
      }
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      setError("Delete failed: network error");
    }
  }

  async function handleEdit(postId: string) {
    if (!editTitle.trim()) return;
    await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, title: editTitle }),
    });
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, title: editTitle } : p))
    );
    setEditingId(null);
  }

  async function openAnalytics(postId: string) {
    setAnalyticsPostId(postId);
    try {
      const res = await fetch(`/api/admin/post-analytics?postId=${postId}`);
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
  }

  const filtered = posts.filter((p) => {
    if (filter === "reported") return p.reported;
    if (filter === "collected") return !p.is_user_created;
    return true;
  });

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg px-4 py-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Content ({posts.length})</h1>
        <div className="flex gap-2">
          {(["all", "reported", "collected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-bold capitalize transition ${
                filter === f
                  ? "bg-sky-500/15 text-sky-400 border border-sky-400/20"
                  : ""
              }`}
              style={filter !== f ? { color: "var(--muted)", backgroundColor: "var(--glass-bg)", border: "1px solid var(--glass-border)" } : undefined}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>Loading...</p>
      ) : (
        <div className="space-y-1">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: "var(--glass-bg)", border: `1px solid ${p.reported ? "rgba(239,68,68,0.3)" : "var(--glass-border)"}` }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {editingId === p.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 rounded-lg px-2 py-1 text-sm text-foreground outline-none"
                        style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}
                      />
                      <button onClick={() => handleEdit(p.id)} className="text-emerald-400">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} style={{ color: "var(--muted)" }}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openAnalytics(p.id)}
                      className="text-sm font-semibold text-foreground truncate hover:text-sky-400 transition"
                    >
                      {p.title}
                    </button>
                  )}
                  <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                    {p.category} · {p.source ?? "user"} · {new Date(p.created_at).toLocaleDateString()}
                    {p.reported && <span className="ml-2 text-red-400 font-bold">REPORTED</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => { setEditingId(p.id); setEditTitle(p.title); }}
                    className="rounded-lg p-1.5 transition"
                    style={{ color: "var(--muted)" }}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="rounded-lg p-1.5 text-red-400 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Modal */}
      {analyticsPostId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => { setAnalyticsPostId(null); setAnalytics(null); }}
        >
          <div
            className="w-full max-w-md rounded-2xl border bg-surface-1 p-6 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Post Analytics</h2>
              <button
                onClick={() => { setAnalyticsPostId(null); setAnalytics(null); }}
                className="rounded-lg p-1 transition"
                style={{ color: "var(--muted)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {analytics ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-[11px] text-muted mb-1">Title</p>
                  <p className="text-sm font-semibold text-foreground line-clamp-2">{analytics.post.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-white/5 text-center">
                    <p className="text-[11px] text-muted">Views</p>
                    <p className="text-xl font-bold text-sky-400">{analytics.post.views_count}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 text-center">
                    <p className="text-[11px] text-muted">Score</p>
                    <p className="text-xl font-bold text-emerald-400">{analytics.post.cached_engagement_score.toFixed(0)}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-[11px] text-muted mb-2">Reactions</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-emerald-400">{analytics.reactions.sparked}</p>
                      <p className="text-[10px] text-muted">Sparked</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-orange-400">{analytics.reactions.fired_up}</p>
                      <p className="text-[10px] text-muted">Fired Up</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-yellow-400">{analytics.reactions.bookmarked}</p>
                      <p className="text-[10px] text-muted">Bookmarked</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg bg-white/5 text-center">
                    <p className="text-lg font-bold text-blue-400">{analytics.proofCount}</p>
                    <p className="text-[10px] text-muted">Proofs</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 text-center">
                    <p className="text-lg font-bold text-purple-400">{analytics.commentCount}</p>
                    <p className="text-[10px] text-muted">Comments</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 text-center">
                    <p className="text-lg font-bold text-red-400">{analytics.reportCount}</p>
                    <p className="text-[10px] text-muted">Reports</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--muted)" }}>Loading analytics...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
