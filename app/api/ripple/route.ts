import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tree } = await supabase.rpc("get_ripple_tree", {
    root_user: user.id,
    max_depth: 4,
  });

  if (!tree) {
    return NextResponse.json({ tree: [], totalVibe: 0, treeSize: 0 });
  }

  const totalVibe = tree.reduce(
    (acc: number, node: { vibe_score: number }) => acc + (node.vibe_score ?? 0),
    0
  );

  // Check ripple badge
  if (tree.length >= 6) {
    void supabase
      .from("user_badges")
      .upsert({ user_id: user.id, badge_id: "ripple_1" }, { onConflict: "user_id,badge_id" });
  }

  return NextResponse.json({
    tree,
    totalVibe,
    treeSize: tree.length - 1, // exclude self
  });
}
