import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.toUpperCase().trim();

  if (!code) {
    return NextResponse.json({ valid: false, message: "No code provided" }, { status: 400 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Try RPC first (SECURITY DEFINER — bypasses RLS, checks both tables)
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

    // RPC not available — direct query on invite_codes (using(true) allows anon)
    if (rpcError) {
      console.error("[check-invite] RPC error:", rpcError.message);
    }

    const { data, error } = await supabase
      .from("invite_codes")
      .select("code,used_by")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      console.error("[check-invite] invite_codes query error:", error.message);
      return NextResponse.json({ valid: false, message: "Invalid invite code" });
    }

    if (data) {
      if (data.used_by) {
        return NextResponse.json({ valid: false, message: "This invite code has already been used" });
      }
      return NextResponse.json({ valid: true, code: data.code });
    }

    return NextResponse.json({ valid: false, message: "Invalid invite code" });
  } catch (err) {
    console.error("[check-invite] unexpected error:", err);
    return NextResponse.json({ valid: false, message: "Invalid invite code" });
  }
}
