import { AdminReportsClient } from "@/components/AdminReportsClient";
import { requireAdmin } from "@/lib/admin";

export const metadata = {
  title: "Reports | Liftly Admin",
};

export default async function AdminReportsPage() {
  await requireAdmin();

  return <AdminReportsClient />;
}
