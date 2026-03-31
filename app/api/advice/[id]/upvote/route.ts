import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// Helper to calculate points based on upvote count
function calculateAdvicePoints(upvotes: number): number {
  if (upvotes < 5) return 0;
  if (upvotes === 5) return 2;
  if (upvotes % 10 === 0) return 1; // +1 for every 10 upvotes after the first 5
  return 0;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;

    // Check if advice exists
    const { data: advice, error: adviceError } = await supabase
      .from("advice")
      .select("id,user_id,question_id")
      .eq("id", id)
      .single();

    if (adviceError || !advice) {
      return NextResponse.json({ error: "Advice not found" }, { status: 404 });
    }

    // Check if user has already upvoted this advice
    const { data: existingUpvote, error: upvoteCheckError } = await supabase
      .from("advice_upvotes")
      .select("id")
      .eq("advice_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    let action = "added";

    if (existingUpvote) {
      // Remove upvote (toggle off)
      const { error: deleteError } = await supabase
        .from("advice_upvotes")
        .delete()
        .eq("advice_id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      action = "removed";
    } else {
      // Add upvote (toggle on)
      const { error: insertError } = await supabase
        .from("advice_upvotes")
        .insert({
          advice_id: id,
          user_id: user.id,
        });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    // Get updated upvote count
    const { count: upvotesCount, error: countError } = await supabase
      .from("advice_upvotes")
      .select("id", { count: "exact", head: true })
      .eq("advice_id", id);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // If upvote was added and reached threshold, give points to advice author
    if (action === "added") {
      const pointsToAdd = calculateAdvicePoints(upvotesCount ?? 0);

      if (pointsToAdd > 0 && advice.user_id) {
        const { data: authorProfile } = await supabase
          .from("profiles")
          .select("vibe_score")
          .eq("id", advice.user_id)
          .single();

        if (authorProfile) {
          await supabase
            .from("profiles")
            .update({ vibe_score: (authorProfile.vibe_score ?? 0) + pointsToAdd })
            .eq("id", advice.user_id);
        }
      }
    }

    return NextResponse.json({
      upvotes_count: upvotesCount,
      user_upvoted: action === "added",
    });
  } catch (err) {
    console.error("[advice/:id/upvote] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
