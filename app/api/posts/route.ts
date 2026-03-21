import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

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

  const { data, error } = await supabase
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("vibe_score")
    .eq("id", user.id)
    .single();
  if (profile) {
    await supabase
      .from("profiles")
      .update({ vibe_score: (profile.vibe_score ?? 0) + 2 })
      .eq("id", user.id);
  }

  return NextResponse.json({ post: data });
}

export async function PUT(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, title, content, category, tags, gradient } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Missing post id" }, { status: 400 });
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!existing || existing.author_id !== user.id) {
    return NextResponse.json({ error: "Not found or not authorized" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (title?.trim()) updates.title = title.trim();
  if (Array.isArray(content) && content.length > 0) updates.content = content;
  if (category) updates.category = category;
  if (Array.isArray(tags)) updates.tags = tags;
  if (gradient) updates.gradient = gradient;

  const { data, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", id)
    .select("id,title,category,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Missing post id" }, { status: 400 });
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!existing || existing.author_id !== user.id) {
    return NextResponse.json({ error: "Not found or not authorized" }, { status: 403 });
  }

  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
