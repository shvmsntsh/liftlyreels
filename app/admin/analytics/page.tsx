import { AdminAnalyticsClient } from "@/components/AdminAnalyticsClient";
import { requireAdmin } from "@/lib/admin";

export const metadata = {
  title: "Analytics | Liftly Admin",
};

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-[13px] text-muted mt-1">System insights and user engagement metrics</p>
      </div>
      <AdminAnalyticsClient />
    </div>
  );
}
