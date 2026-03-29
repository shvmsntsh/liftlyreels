"use client";

import { useState, useEffect } from "react";
import { Play, Loader2 } from "lucide-react";

type CollectionLog = {
  id: string;
  run_at: string;
  items_collected: number;
  items_deleted: number;
  sources_summary: Record<string, number>;
  errors: string[] | null;
  triggered_by: string;
};

export default function AdminCollectorPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [logs, setLogs] = useState<CollectionLog[]>([]);

  useEffect(() => {
    fetch("/api/admin/collect")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .catch(() => null);
  }, []);

  async function runCollector() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/collect", { method: "POST" });
      const data = await res.json();
      setResult(data);
      // Refresh logs
      const logsRes = await fetch("/api/admin/collect");
      const logsData = await logsRes.json();
      setLogs(logsData.logs ?? []);
    } catch (e) {
      setResult({ error: String(e) });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Content Collector</h1>
        <button
          onClick={runCollector}
          disabled={running}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {running ? "Running..." : "Run Collector Now"}
        </button>
      </div>

      {result && (
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
        >
          <p className="text-sm font-semibold text-foreground mb-2">Latest Run Result</p>
          <pre className="text-xs overflow-auto whitespace-pre-wrap" style={{ color: "var(--muted)" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {logs.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Recent Runs</p>
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-foreground">
                  {new Date(log.run_at).toLocaleString()}
                </p>
                <span
                  className="text-[10px] font-bold uppercase rounded-full px-2 py-0.5"
                  style={{ backgroundColor: "var(--glass-bg)", color: "var(--muted)" }}
                >
                  {log.triggered_by}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                +{log.items_collected} collected, -{log.items_deleted} deleted
                {log.sources_summary && ` · Guardian: ${log.sources_summary.guardian ?? 0}, Reddit: ${log.sources_summary.reddit ?? 0}`}
              </p>

              {/* Category breakdown */}
              {log.sources_summary?.category_counts && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(log.sources_summary.category_counts as Record<string, number>).map(([cat, count]) => (
                    <span
                      key={cat}
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: count < 2 ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                        color: count < 2 ? "#f87171" : "#6ee7b7",
                      }}
                    >
                      {cat}: {count}
                    </span>
                  ))}
                </div>
              )}

              {log.errors && log.errors.length > 0 && (
                <p className="text-[11px] text-red-400 mt-1">{log.errors.length} error(s)</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
