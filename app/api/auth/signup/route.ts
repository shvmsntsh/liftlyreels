import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

function generateInviteCode(): string {
  const words = [
    "SPARK", "RISE", "LIFT", "GLOW", "FIRE", "GROW", "BOLD",
    "MIND", "SOUL", "PEAK", "FLOW", "VIBE", "FUEL", "CORE",
  ];
  const nums = Math.floor(Math.random() * 900 + 100).toString();
  const w1 = words[Math.floor(Math.random() * words.length)];
  const w2 = words[Math.floor(Math.random() * words.length)];
  return `${w1}-${w2}-${nums}`;
}

function isTableMissing(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST205" ||
    error?.message?.includes("schema cache") ||
    error?.message?.includes("does not exist")
  );
}

export async function POST(request: NextRequest) {
  const { userId, username, displayName, inviteCode } = await request.json();

  if (!userId || !username || !inviteCode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const userCode = generateInviteCode();
  const newCodes = Array.from({ length: 3 }, generateInviteCode);

  // Try to validate + use invite code (gracefully skip if tables don't exist yet)
  const { data: codeData, error: codeError } = await supabase
    .from("invite_codes")
    .select("code,used_by,created_by")
    .eq("code", inviteCode.toUpperCase().trim())
    .single();

  const tablesExist = !isTableMissing(codeError);

  if (tablesExist) {
    if (!codeData) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
    }
    if (codeData.used_by) {
      return NextResponse.json({ error: "Invite code already used" }, { status: 400 });
    }

    // Check username availability
    const { data: existing } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      username: username.toLowerCase().trim(),
      display_name: displayName?.trim() || username,
      invite_code: userCode,
      invited_by: codeData.created_by ?? null,
      streak_current: 1,
      streak_last_active: new Date().toISOString().split("T")[0],
    });

    if (profileError && !isTableMissing(profileError)) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Mark invite code as used
    await supabase
      .from("invite_codes")
      .update({ used_by: userId, used_at: new Date().toISOString() })
      .eq("code", inviteCode.toUpperCase().trim());

    // Create 3 invite codes for the new user
    await supabase.from("invite_codes").insert(
      newCodes.map((code) => ({ code, created_by: userId }))
    );
  }
  // If tables don't exist, still succeed — user has Supabase Auth account,
  // profile features will activate once schema is applied

  return NextResponse.json({ success: true, userCode, newCodes });
}
