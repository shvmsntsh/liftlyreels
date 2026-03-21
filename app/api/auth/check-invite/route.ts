import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Bootstrap codes that always work — used when invite_codes table isn't set up yet
const BOOTSTRAP_CODES = new Set([
  "SPARK-RISE-001",
  "SPARK-RISE-002",
  "SPARK-RISE-003",
  "LIFT-UP-2025",
  "GLOW-UP-REELS",
  "MINDSET-FIRST",
  "BETTER-DAILY-1",
  "GRIND-SMART-01",
  "INNER-FIRE-001",
  "POSITIVITY-KEY",
]);

function isTableMissing(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST205" ||
    error?.message?.includes("schema cache") ||
    error?.message?.includes("does not exist")
  );
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.toUpperCase().trim();

  if (!code) {
    return NextResponse.json({ valid: false, message: "No code provided" }, { status: 400 });
  }

  // Always accept bootstrap codes
  if (BOOTSTRAP_CODES.has(code)) {
    return NextResponse.json({ valid: true, code });
  }

  try {
    // Use a plain client (no cookies needed — this endpoint is called by unauthenticated users)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Try the RPC function first (bypasses RLS via SECURITY DEFINER)
    const { data: rpcResult, error: rpcError } = await supabase.rpc("check_invite_code", {
      code_input: code,
    });

    if (!rpcError && rpcResult) {
      const result = typeof rpcResult === "string" ? JSON.parse(rpcResult) : rpcResult;
      if (result.valid) {
        return NextResponse.json({ valid: true, code: result.code || code });
      }
      if (result.used) {
        return NextResponse.json({ valid: false, message: "This invite code has already been used" });
      }
      return NextResponse.json({ valid: false, message: "Invalid invite code" });
    }

    // RPC doesn't exist — fall back to direct queries
    // invite_codes has using(true) policy, so anon client should work
    const { data, error } = await supabase
      .from("invite_codes")
      .select("code,used_by,used_at")
      .eq("code", code)
      .maybeSingle();

    if (isTableMissing(error)) {
      return NextResponse.json({ valid: false, message: "Invalid invite code" });
    }

    if (error) {
      console.error("[check-invite] invite_codes query error:", error.code, error.message);
    }

    // Found in invite_codes table
    if (data) {
      if (data.used_by) {
        return NextResponse.json({ valid: false, message: "This invite code has already been used" });
      }
      return NextResponse.json({ valid: true, code: data.code });
    }

    // Not found in invite_codes — check if it's a personal code on someone's profile
    // This query may fail for anon users if profiles requires authenticated role.
    // That's expected — the code will be validated again in the signup API with auth context.
    const { data: profileWithCode, error: profileError } = await supabase
      .from("profiles")
      .select("id,invite_code")
      .eq("invite_code", code)
      .maybeSingle();

    if (profileError) {
      console.error("[check-invite] profiles query error:", profileError.code, profileError.message);
      // If RLS blocks the profiles check, accept the code optimistically.
      // The signup API will do the real validation with an authenticated client.
      if (profileError.code === "42501" || profileError.message?.includes("permission")) {
        // Code matches invite code pattern — accept it for now, real validation happens at signup
        if (/^[A-Z]+-[A-Z]+-\d{3}$/.test(code)) {
          return NextResponse.json({ valid: true, code, provisional: true });
        }
      }
    }

    if (profileWithCode) {
      return NextResponse.json({ valid: true, code });
    }

    // Last resort: if the code matches the invite code format, accept it provisionally.
    // Real validation will happen in the signup API with an authenticated client.
    if (/^[A-Z]+-[A-Z]+-\d{3}$/.test(code)) {
      return NextResponse.json({ valid: true, code, provisional: true });
    }

    return NextResponse.json({ valid: false, message: "Invalid invite code" });
  } catch (err) {
    console.error("[check-invite] unexpected error:", err);
    // If the code matches the format, accept provisionally
    if (/^[A-Z]+-[A-Z]+-\d{3}$/.test(code)) {
      return NextResponse.json({ valid: true, code, provisional: true });
    }
    return NextResponse.json({ valid: false, message: "Invalid invite code" });
  }
}
