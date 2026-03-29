import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await requireAdmin();
  if (!user) redirect("/feed");

  const supabase = createSupabaseServerClient();

  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: totalUsers },
    { count: totalPosts },
    { count: proofsToday },
    { count: reportsCount },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase
      .from("impact_journal")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${today}T00:00:00.000Z`),
    supabase.from("bug_reports").select("id", { count: "exact", head: true }),
  ]);

  // Last collection run
  let lastRun: { run_at: string; items_collected: number; items_deleted: number } | null = null;
  try {
    const { data } = await supabase
      .from("content_collection_log")
      .select("run_at,items_collected,items_deleted")
      .order("run_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    lastRun = data;
  } catch {
    // Table may not exist
  }

  const stats = [
    { label: "Total Users", value: totalUsers ?? 0 },
    { label: "Total Posts", value: totalPosts ?? 0 },
    { label: "Proofs Today", value: proofsToday ?? 0 },
    { label: "Reports", value: reportsCount ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
          >
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {lastRun && (
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
        >
          <p className="text-sm font-semibold text-foreground mb-1">Last Content Collection</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {new Date(lastRun.run_at).toLocaleString()} — {lastRun.items_collected} collected, {lastRun.items_deleted} deleted
          </p>
        </div>
      )}
    </div>
  );
}
