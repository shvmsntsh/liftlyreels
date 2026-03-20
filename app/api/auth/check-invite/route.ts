import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

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

  try {
    const supabase = createSupabaseServiceClient();

    const { data, error } = await supabase
      .from("invite_codes")
      .select("code,used_by,used_at")
      .eq("code", code)
      .single();

    // Table doesn't exist yet — fall back to bootstrap codes
    if (error?.code === "PGRST205" || error?.message?.includes("schema cache")) {
      if (BOOTSTRAP_CODES.has(code)) {
        return NextResponse.json({ valid: true, code });
      }
      return NextResponse.json({ valid: false, message: "Invalid invite code" });
    }

    if (error || !data) {
      // Also check bootstrap codes as fallback
      if (BOOTSTRAP_CODES.has(code)) {
        return NextResponse.json({ valid: true, code });
      }
      return NextResponse.json({ valid: false, message: "Invalid invite code" });
    }

    if (data.used_by) {
      return NextResponse.json(
        { valid: false, message: "This invite code has already been used" },
        { status: 200 }
      );
    }

    return NextResponse.json({ valid: true, code: data.code });
  } catch {
    // On any error, still accept bootstrap codes — reject everything else
    if (BOOTSTRAP_CODES.has(code)) {
      return NextResponse.json({ valid: true, code });
    }
    return NextResponse.json({ valid: false, message: "Invalid invite code" });
  }
}
