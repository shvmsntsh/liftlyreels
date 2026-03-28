import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId, reason } = await request.json();

  if (!postId || !reason) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await supabase.from("bug_reports").insert({
    user_id: user.id,
    title: `Content Report: ${reason}`,
    description: `Reported post ID: ${postId}\nReason: ${reason}\nReported by: ${user.id}`,
    severity: "high",
  });

  return NextResponse.json({ success: true });
}
