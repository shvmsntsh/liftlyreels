import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;

    // Fetch question
    const { data: question, error: questionError } = await supabase
      .from("posts")
      .select("id,title,category,author_id,is_anonymous,created_at")
      .eq("id", id)
      .eq("type", "question")
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Fetch all advice for this question
    const { data: advice, error: adviceError } = await supabase
      .from("advice")
      .select("id, user_id, text, is_anonymous, created_at")
      .eq("question_id", id)
      .order("created_at", { ascending: false });

    if (adviceError) {
      return NextResponse.json({ error: adviceError.message }, { status: 500 });
    }

    // For each advice, fetch upvote count and check if current user has upvoted it
    const adviceWithUpvotes = await Promise.all(
      (advice ?? []).map(async (item: any) => {
        // Get upvote count
        const { count: upvotesCount } = await supabase
          .from("advice_upvotes")
          .select("id", { count: "exact", head: true })
          .eq("advice_id", item.id);

        // Check if user upvoted
        const { data: userUpvote } = await supabase
          .from("advice_upvotes")
          .select("id")
          .eq("advice_id", item.id)
          .eq("user_id", user.id)
          .maybeSingle();

        return {
          id: item.id,
          user_id: item.user_id,
          text: item.text,
          is_anonymous: item.is_anonymous,
          created_at: item.created_at,
          upvotes_count: upvotesCount ?? 0,
          user_upvoted: !!userUpvote,
        };
      })
    );

    // Sort by upvotes count descending, then by created_at
    const adviceWithUserUpvote = adviceWithUpvotes.sort((a, b) => {
      if (b.upvotes_count !== a.upvotes_count) {
        return b.upvotes_count - a.upvotes_count;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({
      question,
      advice: adviceWithUserUpvote,
    });
  } catch (err) {
    console.error("[questions/:id] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
