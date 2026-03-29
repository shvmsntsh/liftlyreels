import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { AdminUsersClient } from "@/components/AdminUsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await requireAdmin();
  if (!user) redirect("/feed");

  return <AdminUsersClient />;
}
