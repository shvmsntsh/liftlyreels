import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getRequestKey } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // 5 signup attempts per hour per IP
  const rl = checkRateLimit(getRequestKey(request, "signup"), 5, 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many signup attempts. Try again later." }, { status: 429 });
  }

  const { userId, accessToken, username, displayName, inviteCode } = await request.json();

  if (!userId || !username || !inviteCode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Single authenticated client
  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    ...(accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : {}),
  });

  const upperCode = inviteCode.toUpperCase().trim();

  // ── Use complete_signup RPC (does everything atomically, bypasses RLS) ──
  const { data: rpcResult, error: rpcError } = await supabase.rpc("complete_signup", {
    p_user_id: userId,
    p_username: username.trim().toLowerCase(),
    p_display_name: displayName?.trim() || username,
    p_invite_code: upperCode,
  });

  if (!rpcError && rpcResult) {
    const result = typeof rpcResult === "string" ? JSON.parse(rpcResult) : rpcResult;
    if (result.success) {
      return NextResponse.json({
        success: true,
        userCode: result.user_code,
        newCodes: result.new_codes || [],
        alreadyExists: result.already_exists || false,
      });
    }
    return NextResponse.json({ error: result.error || "Signup failed" }, { status: 400 });
  }

  // ── Fallback: RPC not available ──
  console.error("[signup] complete_signup RPC error:", rpcError?.message);

  // Validate invite code via check_invite_code RPC or direct query
  let codeValid = false;

  const { data: checkResult, error: checkError } = await supabase.rpc("check_invite_code", {
    code_input: upperCode,
  });

  if (!checkError && checkResult) {
    const parsed = typeof checkResult === "string" ? JSON.parse(checkResult) : checkResult;
    if (parsed.valid) codeValid = true;
    if (parsed.used) {
      return NextResponse.json({ error: "Invite code already used" }, { status: 400 });
    }
  } else {
    // No RPC — try direct invite_codes query (using(true) allows anon)
    const { data: codeRow } = await supabase
      .from("invite_codes")
      .select("code,used_by")
      .eq("code", upperCode)
      .maybeSingle();

    if (codeRow) {
      if (codeRow.used_by) {
        return NextResponse.json({ error: "Invite code already used" }, { status: 400 });
      }
      codeValid = true;
    }
  }

  if (!codeValid) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
  }

  // Check username
  const { data: existing } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Username already taken" }, { status: 400 });
  }

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfile) {
    return NextResponse.json({ success: true, alreadyExists: true });
  }

  // Create profile
  const words = ["SPARK","RISE","LIFT","GLOW","FIRE","GROW","BOLD","MIND","SOUL","PEAK","FLOW","VIBE","FUEL","CORE"];
  const genCode = () => {
    const w1 = words[Math.floor(Math.random() * words.length)];
    const w2 = words[Math.floor(Math.random() * words.length)];
    const n = Math.floor(Math.random() * 900 + 100);
    return `${w1}-${w2}-${n}`;
  };
  const userCode = genCode();
  const newCodes = [genCode(), genCode(), genCode()];

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    username: username.toLowerCase().trim(),
    display_name: displayName?.trim() || username,
    invite_code: userCode,
    streak_current: 1,
    streak_last_active: new Date().toISOString().split("T")[0],
  });

  if (profileError) {
    console.error("[signup] profile insert error:", profileError.message);
    if (profileError.code === "23505") {
      return NextResponse.json({ success: true, alreadyExists: true });
    }
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Mark code used + insert new codes (best-effort, don't block signup)
  await supabase
    .from("invite_codes")
    .update({ used_by: userId, used_at: new Date().toISOString() })
    .eq("code", upperCode);

  await supabase.from("invite_codes").insert([
    { code: userCode, created_by: userId },
    ...newCodes.map((c) => ({ code: c, created_by: userId })),
  ]);

  return NextResponse.json({ success: true, userCode, newCodes });
}
