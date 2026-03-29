"use client";

import { useEffect, useState } from "react";

type AnalyticsData = {
  stats: {
    totalUsers: number;
    totalPosts: number;
    totalProofs: number;
    totalReports: number;
  };
  today: {
    proofs: number;
    reactions: number;
    signups: number;
  };
  averages: {
    proofsPerDay: string;
  };
  charts: {
    signupsByDay: Record<string, number>;
    proofsByDay: Record<string, number>;
    reactionsByDay: Record<string, number>;
    categoryDistribution: Record<string, number>;
    provedCategories: Record<string, number>;
  };
  topPosts: Array<{ id: string; title: string; category: string; views_count: number; cached_engagement_score: number }>;
  collectorLogs: Array<{ run_at: string; items_collected: number; items_deleted: number; errors?: string[] }>;
  apiErrors: Array<{ endpoint: string; status_code: number; created_at: string }>;
  bugSeverity: Record<string, number>;
};

export function AdminAnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-sm" style={{ color: "var(--muted)" }}>Loading analytics...</div>;
  }

  if (!data) {
    return <div className="text-sm text-red-400">Failed to load analytics</div>;
  }

  // Simple bar chart renderer
  const renderBarChart = (data: Record<string, number>, title: string) => {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map((e) => e[1]), 1);
    return (
      <div className="mb-6 rounded-2xl border bg-surface-1 p-4">
        <p className="text-sm font-bold text-foreground mb-3">{title}</p>
        <div className="space-y-2">
          {entries.slice(0, 10).map(([label, value]) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-24 text-[11px] text-muted truncate">{label}</div>
              <div className="flex-1 h-5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all"
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
              <div className="w-8 text-right text-[11px] font-semibold text-foreground">{value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Main stats */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          { label: "Total Users", value: data.stats.totalUsers },
          { label: "Total Posts", value: data.stats.totalPosts },
          { label: "Total Proofs", value: data.stats.totalProofs },
          { label: "Reports", value: data.stats.totalReports },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border bg-surface-1 p-3 text-center">
            <div className="text-xl font-black text-foreground">{value}</div>
            <div className="text-[9px] uppercase text-muted mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Today's activity */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Proofs Today", value: data.today.proofs },
          { label: "Reactions Today", value: data.today.reactions },
          { label: "Signups Today", value: data.today.signups },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border bg-surface-1 p-3 text-center">
            <div className="text-lg font-bold text-emerald-400">{value}</div>
            <div className="text-[9px] uppercase text-muted mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Distribution charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderBarChart(data.charts.categoryDistribution, "Category Distribution")}
        {renderBarChart(data.charts.provedCategories, "Most Proved Categories")}
      </div>

      {/* Top posts */}
      <div className="rounded-2xl border bg-surface-1 p-4">
        <p className="text-sm font-bold text-foreground mb-3">Top Posts (by views)</p>
        <div className="space-y-2">
          {data.topPosts.slice(0, 10).map((post) => (
            <div key={post.id} className="flex justify-between items-center p-2 rounded-lg bg-white/5 text-[11px]">
              <div className="flex-1 min-w-0">
                <p className="text-foreground truncate font-semibold">{post.title}</p>
                <p className="text-muted">{post.category}</p>
              </div>
              <div className="text-right ml-2">
                <p className="text-foreground font-bold">{post.views_count} views</p>
                <p className="text-muted text-[10px]">score: {post.cached_engagement_score.toFixed(0)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Collector runs */}
      <div className="rounded-2xl border bg-surface-1 p-4">
        <p className="text-sm font-bold text-foreground mb-3">Recent Collection Runs</p>
        <div className="space-y-2">
          {data.collectorLogs.map((log, i) => (
            <div key={i} className="p-2 rounded-lg bg-white/5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted">{new Date(log.run_at).toLocaleDateString()}</span>
                <span className="text-emerald-400">{log.items_collected} collected</span>
                <span className="text-red-400">{log.items_deleted} deleted</span>
              </div>
              {log.errors && log.errors.length > 0 && (
                <p className="text-red-400 text-[10px] mt-1">{log.errors.join(", ")}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* API errors */}
      {data.apiErrors.length > 0 && (
        <div className="rounded-2xl border bg-surface-1 p-4">
          <p className="text-sm font-bold text-foreground mb-3">Recent API Errors</p>
          <div className="space-y-1 text-[11px]">
            {data.apiErrors.map((err, i) => (
              <div key={i} className="text-muted">
                <span className="text-red-400 font-bold">{err.status_code}</span> {err.endpoint} · {new Date(err.created_at).toLocaleString()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
