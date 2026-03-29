import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { AdminContentClient } from "@/components/AdminContentClient";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const user = await requireAdmin();
  if (!user) redirect("/feed");

  return <AdminContentClient />;
}
