import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

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
    const supabase = createSupabaseServerClient();

    // Check invite_codes table first
    const { data, error } = await supabase
      .from("invite_codes")
      .select("code,used_by,used_at")
      .eq("code", code)
      .single();

    // Table doesn't exist yet — only bootstrap codes work
    if (error?.code === "PGRST205" || error?.message?.includes("schema cache")) {
      return NextResponse.json({ valid: false, message: "Invalid invite code" });
    }

    // Found in invite_codes table
    if (data) {
      if (data.used_by) {
        return NextResponse.json({ valid: false, message: "This invite code has already been used" });
      }
      return NextResponse.json({ valid: true, code: data.code });
    }

    // Not found in invite_codes — check if it's a personal code on someone's profile
    const { data: profileWithCode } = await supabase
      .from("profiles")
      .select("id,invite_code")
      .eq("invite_code", code)
      .single();

    if (profileWithCode) {
      return NextResponse.json({ valid: true, code });
    }

    return NextResponse.json({ valid: false, message: "Invalid invite code" });
  } catch {
    // On any error, reject non-bootstrap codes
    return NextResponse.json({ valid: false, message: "Invalid invite code" });
  }
}
