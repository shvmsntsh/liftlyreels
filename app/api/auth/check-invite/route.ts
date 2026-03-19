import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

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

    if (error || !data) {
      return NextResponse.json({ valid: false, message: "Invalid invite code" }, { status: 200 });
    }

    if (data.used_by) {
      return NextResponse.json(
        { valid: false, message: "This invite code has already been used" },
        { status: 200 }
      );
    }

    return NextResponse.json({ valid: true, code: data.code });
  } catch {
    return NextResponse.json({ valid: false, message: "Error checking code" }, { status: 500 });
  }
}
