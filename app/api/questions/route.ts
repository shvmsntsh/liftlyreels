import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const sort = searchParams.get("sort") ?? "newest"; // 'newest' or 'trending'

    let query = supabase
      .from("posts")
      .select(
        `
        id,
        title,
        category,
        author_id,
        is_anonymous,
        created_at,
        (select count(*) from advice where question_id = posts.id)::int as advice_count
        `
      )
      .eq("type", "question");

    if (category) {
      query = query.eq("category", category);
    }

    if (sort === "trending") {
      // Sort by advice count descending, then by created_at
      query = query.order("advice_count", { ascending: false });
    } else {
      // Default: newest first
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: questions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ questions: questions ?? [] });
  } catch (err) {
    console.error("[questions] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 5 questions per day per user
  const rl = checkRateLimit(`questions:${user.id}`, 5, 24 * 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Question limit reached. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const { title, category, is_anonymous } = await request.json();

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (title.trim().length < 10) {
      return NextResponse.json({ error: "Question must be at least 10 characters" }, { status: 400 });
    }

    if (title.trim().length > 200) {
      return NextResponse.json({ error: "Question must be less than 200 characters" }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    // Create question as a post with type='question'
    const { data, error } = await supabase
      .from("posts")
      .insert({
        title: title.trim(),
        content: [], // Questions don't have content bullets
        category,
        source: "Community",
        author_id: user.id,
        is_user_created: true,
        type: "question",
        is_anonymous,
        gradient: "ocean", // Default gradient for questions
      })
      .select("id,title,category,created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "A question with this title already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Give author +1 vibe for asking a question
    const { data: profile } = await supabase
      .from("profiles")
      .select("vibe_score")
      .eq("id", user.id)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({ vibe_score: (profile.vibe_score ?? 0) + 1 })
        .eq("id", user.id);
    }

    // Log to impact_journal for streak counting (non-blocking)
    void (async () => {
      try {
        await supabase.from("impact_journal").insert({
          user_id: user.id,
          post_id: data.id,
          action_taken: "Asked a question",
        });
      } catch {
        // Non-blocking, ignore errors
      }
    })();

    return NextResponse.json({ question: data });
  } catch (err) {
    console.error("[questions POST] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
