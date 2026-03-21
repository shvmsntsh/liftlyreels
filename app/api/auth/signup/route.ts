import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getRequestKey } from "@/lib/rate-limit";

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

// Bootstrap codes that always work even if DB tables are missing
const BOOTSTRAP_CODES = new Set([
  "SPARK-RISE-001", "SPARK-RISE-002", "SPARK-RISE-003",
  "LIFT-UP-2025", "GLOW-UP-REELS", "MINDSET-FIRST",
  "BETTER-DAILY-1", "GRIND-SMART-01", "INNER-FIRE-001", "POSITIVITY-KEY",
]);

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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Use service role key if available (bypasses RLS), otherwise use access token
  // Access token satisfies RLS policy "auth.uid() = id" for profile creation
  const authKey = serviceRoleKey || anonKey;
  const adminClient = createClient(supabaseUrl, authKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Separate user-context client using the access token for operations that need auth.uid()
  const userClient = accessToken
    ? createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      })
    : adminClient;

  const userCode = generateInviteCode();
  const newCodes = Array.from({ length: 3 }, generateInviteCode);

  // Validate invite code
  const upperCode = inviteCode.toUpperCase().trim();
  const isBootstrap = BOOTSTRAP_CODES.has(upperCode);

  // Use the authenticated userClient for reads (adminClient may lack auth context
  // when SUPABASE_SERVICE_ROLE_KEY is not set, causing RLS to block queries)
  const readClient = userClient;

  const { data: codeData, error: codeError } = await readClient
    .from("invite_codes")
    .select("code,used_by,created_by")
    .eq("code", upperCode)
    .single();

  const tablesExist = !isTableMissing(codeError);

  if (tablesExist) {
    // If not found in invite_codes, check if it's a personal code from profiles table
    let resolvedCodeData = codeData;
    if (!codeData && !isBootstrap) {
      const { data: profileWithCode } = await readClient
        .from("profiles")
        .select("id,invite_code")
        .eq("invite_code", upperCode)
        .single();

      if (profileWithCode) {
        // Insert this personal code into invite_codes for proper tracking
        await readClient
          .from("invite_codes")
          .insert({ code: upperCode, created_by: profileWithCode.id })
          .single();
        resolvedCodeData = { code: upperCode, used_by: null, created_by: profileWithCode.id };
      } else {
        return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
      }
    }
    if (resolvedCodeData?.used_by) {
      return NextResponse.json({ error: "Invite code already used" }, { status: 400 });
    }

    // Check username availability
    const { data: existing } = await readClient
      .from("profiles")
      .select("username")
      .eq("username", username.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    // Check if profile already exists for this userId
    const { data: existingProfile } = await readClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (existingProfile) {
      // Profile already exists — user is re-entering, just return success
      return NextResponse.json({ success: true, userCode, newCodes, alreadyExists: true });
    }

    // Create profile — use userClient so auth.uid() = id is satisfied
    const profilePayload = {
      id: userId,
      username: username.toLowerCase().trim(),
      display_name: displayName?.trim() || username,
      invite_code: userCode,
      invited_by: resolvedCodeData?.created_by ?? null,
      streak_current: 1,
      streak_last_active: new Date().toISOString().split("T")[0],
    };

    const { error: profileError } = await userClient.from("profiles").insert(profilePayload);

    if (profileError && !isTableMissing(profileError)) {
      // If RLS blocks, try with admin client
      const { error: adminProfileError } = await adminClient.from("profiles").insert(profilePayload);
      if (adminProfileError && !isTableMissing(adminProfileError)) {
        // Duplicate key = profile already exists, treat as success
        if (adminProfileError.code === "23505") {
          return NextResponse.json({ success: true, userCode, newCodes, alreadyExists: true });
        }
        return NextResponse.json({ error: adminProfileError.message }, { status: 500 });
      }
    }

    // Mark invite code as used — try userClient first, fall back to adminClient
    const { error: markError } = await userClient
      .from("invite_codes")
      .update({ used_by: userId, used_at: new Date().toISOString() })
      .eq("code", upperCode);

    if (markError) {
      // Retry with admin client if userClient RLS blocked the update
      await adminClient
        .from("invite_codes")
        .update({ used_by: userId, used_at: new Date().toISOString() })
        .eq("code", upperCode);
    }

    // Give new user their personal code + 3 extra invite codes
    const newCodeRows = [
      { code: userCode, created_by: userId },
      ...newCodes.map((code) => ({ code, created_by: userId })),
    ];

    const { error: insertError } = await userClient
      .from("invite_codes")
      .insert(newCodeRows);

    if (insertError) {
      // Retry with admin client
      await adminClient.from("invite_codes").insert(newCodeRows);
    }
  }

  return NextResponse.json({ success: true, userCode, newCodes });
}
