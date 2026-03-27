import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST() {
  const supabase = createSupabaseServerClient();

  const authResult = await Promise.race([
    supabase.auth.getUser(),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
  ]).catch(() => null);

  const user = (authResult as Awaited<ReturnType<typeof supabase.auth.getUser>> | null)?.data?.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Best-effort RPC — don't let it hang if the function doesn't exist
  await Promise.race([
    supabase.rpc("update_user_streak", { user_uuid: user.id }),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]).catch(() => null);

  const { data: profile } = await supabase
    .from("profiles")
    .select("streak_current,streak_longest,vibe_score")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ profile });
}
