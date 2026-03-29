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

export function AdminContentClient() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [filter, setFilter] = useState<"all" | "reported" | "collected">("all");

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(postId: string) {
    if (!confirm("Delete this post permanently?")) return;
    await fetch("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    setPosts((prev) => prev.filter((p) => p.id !== postId));
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

  const filtered = posts.filter((p) => {
    if (filter === "reported") return p.reported;
    if (filter === "collected") return !p.is_user_created;
    return true;
  });

  return (
    <div className="space-y-4">
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
                    <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
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
    </div>
  );
}
