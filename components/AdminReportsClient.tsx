"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

type Report = {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  created_at: string;
  user_id: string;
  post?: {
    id: string;
    title: string;
    category: string;
    author_id: string;
  };
};

export function AdminReportsClient() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "triaging" | "fixed">("all");

  useEffect(() => {
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then((d) => setReports(d.reports ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(reportId: string, newStatus: string) {
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, status: newStatus }),
    });
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
    );
  }

  const filtered = reports.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const severityColor: Record<string, string> = {
    low: "text-blue-400",
    medium: "text-yellow-400",
    high: "text-orange-400",
    critical: "text-red-500",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Content Reports ({reports.length})</h1>
        <div className="flex gap-2">
          {(["all", "open", "triaging", "fixed"] as const).map((f) => (
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto opacity-50 mb-2" />
          <p className="text-sm" style={{ color: "var(--muted)" }}>No {filter === "all" ? "reports" : `${filter} reports`}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((report) => (
            <div
              key={report.id}
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {report.post?.title ?? "Unknown reel"}
                    </p>
                    <span className={`text-[10px] font-bold ${severityColor[report.severity] ?? "text-gray-400"}`}>
                      {report.severity.toUpperCase()}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                      {report.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted">
                    {report.post?.category ?? "Unknown"} · {new Date(report.created_at).toLocaleDateString()}
                  </p>
                  {report.description && (
                    <p className="text-[11px] text-white/70 mt-1 line-clamp-2">{report.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={report.status}
                    onChange={(e) => updateStatus(report.id, e.target.value)}
                    className="text-[11px] rounded-lg px-2 py-1 outline-none"
                    style={{ backgroundColor: "var(--surface-2)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                  >
                    <option value="open">Open</option>
                    <option value="triaging">Triaging</option>
                    <option value="fixed">Fixed</option>
                    <option value="wontfix">Won&apos;t Fix</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
