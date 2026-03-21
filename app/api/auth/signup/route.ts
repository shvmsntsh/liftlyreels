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
  const hasServiceKey = serviceRoleKey && serviceRoleKey.length > 20;
  const authKey = hasServiceKey ? serviceRoleKey : anonKey;
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

  // Plain anon client for tables with using(true) policies (invite_codes)
  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const userCode = generateInviteCode();
  const newCodes = Array.from({ length: 3 }, generateInviteCode);

  // Validate invite code
  const upperCode = inviteCode.toUpperCase().trim();
  const isBootstrap = BOOTSTRAP_CODES.has(upperCode);

  // ── Try RPC function first (bypasses RLS via SECURITY DEFINER) ──
  let rpcValidated = false;
  let inviteCodeCreator: string | null = null;

  if (!isBootstrap) {
    const { data: rpcResult, error: rpcError } = await userClient.rpc("check_invite_code", {
      code_input: upperCode,
    });

    if (!rpcError && rpcResult) {
      const result = typeof rpcResult === "string" ? JSON.parse(rpcResult) : rpcResult;
      console.log("[signup] RPC result for code", upperCode, ":", JSON.stringify(result));
      if (result.valid) {
        rpcValidated = true;
        inviteCodeCreator = result.created_by ?? null;
      } else if (result.used) {
        return NextResponse.json({ error: "Invite code already used" }, { status: 400 });
      }
      // If RPC says invalid, DON'T return yet — fall through to direct queries as backup
    } else if (rpcError) {
      console.log("[signup] RPC check_invite_code not available, using direct queries:", rpcError.message);
    }
  }

  // ── Fallback: direct DB queries if RPC not available ──
  if (!isBootstrap && !rpcValidated) {
    // Try invite_codes table with BOTH anon and user clients
    // invite_codes has using(true) so anon should work, but try user client too
    let codeData: { code: string; used_by: string | null; created_by: string | null } | null = null;
    let tablesExist = true;

    // Try anon client first (invite_codes allows anon access via using(true))
    const { data: anonCodeData, error: anonCodeError } = await anonClient
      .from("invite_codes")
      .select("code,used_by,created_by")
      .eq("code", upperCode)
      .maybeSingle();

    if (isTableMissing(anonCodeError)) {
      tablesExist = false;
    } else if (anonCodeError) {
      console.error("[signup] anon invite_codes query error:", anonCodeError.code, anonCodeError.message);
      // Try with authenticated client as fallback
      const { data: authCodeData, error: authCodeError } = await userClient
        .from("invite_codes")
        .select("code,used_by,created_by")
        .eq("code", upperCode)
        .maybeSingle();

      if (isTableMissing(authCodeError)) {
        tablesExist = false;
      } else if (authCodeError) {
        console.error("[signup] auth invite_codes query error:", authCodeError.code, authCodeError.message);
      } else {
        codeData = authCodeData;
      }
    } else {
      codeData = anonCodeData;
    }

    if (tablesExist) {
      if (codeData) {
        // Found in invite_codes
        if (codeData.used_by) {
          return NextResponse.json({ error: "Invite code already used" }, { status: 400 });
        }
        inviteCodeCreator = codeData.created_by;
      } else {
        // Not in invite_codes — check profiles table for personal codes
        // Use authenticated client (profiles requires auth.role() = 'authenticated')
        const { data: profileWithCode, error: profileError } = await userClient
          .from("profiles")
          .select("id,invite_code")
          .eq("invite_code", upperCode)
          .maybeSingle();

        if (profileError) {
          console.error("[signup] profiles invite check error:", profileError.code, profileError.message);
        }

        if (profileWithCode) {
          inviteCodeCreator = profileWithCode.id;
          // Insert into invite_codes for tracking (fire-and-forget, don't block signup)
          anonClient
            .from("invite_codes")
            .insert({ code: upperCode, created_by: profileWithCode.id })
            .then(({ error }) => {
              if (error) console.error("[signup] insert invite code tracking error:", error.message);
            });
        } else if (!profileError) {
          // Query succeeded but no match — code genuinely doesn't exist
          return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
        } else {
          // Query errored — RLS may be blocking. Accept codes matching the format.
          if (/^[A-Z]+-[A-Z]+-\d{3}$/.test(upperCode)) {
            console.warn("[signup] profiles query failed, accepting format-matching code:", upperCode);
          } else {
            return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
          }
        }
      }
    }
    // If tables don't exist, skip validation entirely (allow signup)
  }

  // ── Check username availability ──
  const { data: existing, error: usernameError } = await userClient
    .from("profiles")
    .select("username")
    .eq("username", username.toLowerCase().trim())
    .maybeSingle();

  if (usernameError && !isTableMissing(usernameError)) {
    console.error("[signup] username check error:", usernameError.code, usernameError.message);
  }

  if (existing) {
    return NextResponse.json({ error: "Username already taken" }, { status: 400 });
  }

  // ── Check if profile already exists ──
  const { data: existingProfile } = await userClient
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfile) {
    return NextResponse.json({ success: true, userCode, newCodes, alreadyExists: true });
  }

  // ── Create profile ──
  const profilePayload = {
    id: userId,
    username: username.toLowerCase().trim(),
    display_name: displayName?.trim() || username,
    invite_code: userCode,
    invited_by: inviteCodeCreator,
    streak_current: 1,
    streak_last_active: new Date().toISOString().split("T")[0],
  };

  const { error: profileError } = await userClient.from("profiles").insert(profilePayload);

  if (profileError && !isTableMissing(profileError)) {
    console.error("[signup] profile insert error (userClient):", profileError.code, profileError.message);
    // If RLS blocks or FK error, try with admin client
    const { error: adminProfileError } = await adminClient.from("profiles").insert(profilePayload);
    if (adminProfileError && !isTableMissing(adminProfileError)) {
      console.error("[signup] profile insert error (adminClient):", adminProfileError.code, adminProfileError.message);
      if (adminProfileError.code === "23505") {
        return NextResponse.json({ success: true, userCode, newCodes, alreadyExists: true });
      }
      return NextResponse.json({ error: adminProfileError.message }, { status: 500 });
    }
  }

  // ── Mark invite code as used ──
  const markClient = hasServiceKey ? adminClient : userClient;
  const { error: markError } = await markClient
    .from("invite_codes")
    .update({ used_by: userId, used_at: new Date().toISOString() })
    .eq("code", upperCode);

  if (markError) {
    console.error("[signup] mark invite used error:", markError.message);
    // Retry with the other client
    const retryClient = markClient === userClient ? anonClient : userClient;
    const { error: retryMarkError } = await retryClient
      .from("invite_codes")
      .update({ used_by: userId, used_at: new Date().toISOString() })
      .eq("code", upperCode);
    if (retryMarkError) {
      console.error("[signup] mark invite retry error:", retryMarkError.message);
    }
  }

  // ── Give new user their personal code + 3 extra invite codes ──
  const newCodeRows = [
    { code: userCode, created_by: userId },
    ...newCodes.map((code) => ({ code, created_by: userId })),
  ];

  const { error: insertError } = await userClient
    .from("invite_codes")
    .insert(newCodeRows);

  if (insertError) {
    console.error("[signup] insert new codes error (userClient):", insertError.message);
    // Retry with anon client (invite_codes has with check(true))
    const { error: retryInsertError } = await anonClient
      .from("invite_codes")
      .insert(newCodeRows);
    if (retryInsertError) {
      console.error("[signup] insert new codes error (anonClient):", retryInsertError.message);
      // Retry with admin client as last resort
      const { error: adminInsertError } = await adminClient
        .from("invite_codes")
        .insert(newCodeRows);
      if (adminInsertError) {
        console.error("[signup] insert new codes error (adminClient):", adminInsertError.message);
      }
    }
  }

  return NextResponse.json({ success: true, userCode, newCodes });
}
