import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET: list recent collection logs
export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let logs: unknown[] = [];
  try {
    const { data } = await supabase
      .from("content_collection_log")
      .select("*")
      .order("run_at", { ascending: false })
      .limit(20);
    logs = data ?? [];
  } catch {
    // Table may not exist
  }

  return NextResponse.json({ logs });
}

// POST: trigger collection manually (proxies to cron endpoint)
export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Call the cron endpoint internally
  const cronSecret = process.env.CRON_SECRET ?? "";
  const baseUrl = request.headers.get("x-forwarded-proto")
    ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("host")}`
    : `http://localhost:${process.env.PORT ?? 3000}`;

  const res = await fetch(`${baseUrl}/api/cron/collect-content`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cronSecret}` },
  });

  const data = await res.json();
  return NextResponse.json(data);
}
