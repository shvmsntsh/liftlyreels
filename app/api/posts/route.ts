import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, content, category, tags, gradient } = await request.json();

  if (!title?.trim() || !content?.length || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (content.some((item: unknown) => typeof item !== "string")) {
    return NextResponse.json({ error: "Invalid content format" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();

  const { data, error } = await service
    .from("posts")
    .insert({
      title: title.trim(),
      content,
      category,
      source: "Community",
      author_id: user.id,
      is_user_created: true,
      tags: tags ?? [],
      gradient: gradient ?? "ocean",
    })
    .select("id,title,category,created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A reel with this title already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Give author +2 vibe for creating content
  await service
    .from("profiles")
    .select("vibe_score")
    .eq("id", user.id)
    .single()
    .then(({ data: profile }) => {
      if (profile) {
        service
          .from("profiles")
          .update({ vibe_score: (profile.vibe_score ?? 0) + 2 })
          .eq("id", user.id);
      }
    });

  return NextResponse.json({ post: data });
}
