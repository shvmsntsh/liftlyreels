import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch users with highest vibe scores (excluding self)
  let query = supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url,vibe_score,bio")
    .order("vibe_score", { ascending: false })
    .limit(20);

  if (user) {
    query = query.neq("id", user.id);
  }

  const { data: users } = await query;

  return NextResponse.json({ users: users ?? [] });
}
