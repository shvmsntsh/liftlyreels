import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 advice per day per user
  const rl = checkRateLimit(`advice:${user.id}`, 10, 24 * 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Advice limit reached. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const { question_id, text, is_anonymous } = await request.json();

    // Validation
    if (!question_id) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    if (!text?.trim()) {
      return NextResponse.json({ error: "Advice text is required" }, { status: 400 });
    }

    if (text.trim().length < 20) {
      return NextResponse.json({ error: "Advice must be at least 20 characters" }, { status: 400 });
    }

    if (text.trim().length > 1000) {
      return NextResponse.json({ error: "Advice must be less than 1000 characters" }, { status: 400 });
    }

    // Verify question exists
    const { data: question, error: questionError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", question_id)
      .eq("type", "question")
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Insert advice
    const { data, error } = await supabase
      .from("advice")
      .insert({
        question_id,
        user_id: user.id,
        text: text.trim(),
        is_anonymous,
      })
      .select("id,created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Give author +1 vibe for submitting advice (will get +2 more if it reaches 5 upvotes)
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

    // Log to impact_journal for streak counting (link to the question post, non-blocking)
    void (async () => {
      try {
        await supabase.from("impact_journal").insert({
          user_id: user.id,
          post_id: question_id,
          action_taken: "Gave advice",
        });
        await supabase.rpc("update_user_streak", { user_uuid: user.id });
      } catch {
        // Non-blocking, ignore errors
      }
    })();

    return NextResponse.json({ advice: data });
  } catch (err) {
    console.error("[advice POST] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
