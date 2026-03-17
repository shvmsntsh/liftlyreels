import { NextResponse } from "next/server";
import { fetchCuratedBookReels } from "@/lib/book-content";
import { getFallbackPosts } from "@/utils/fallback-posts";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reels = await fetchCuratedBookReels(12);

    if (!reels.length) {
      return NextResponse.json(
        {
          source: "fallback",
          items: getFallbackPosts()
            .filter((post) => post.category === "Books")
            .slice(0, 6),
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ source: "open-library", items: reels }, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        source: "fallback",
        items: getFallbackPosts()
          .filter((post) => post.category === "Books")
          .slice(0, 6),
      },
      { status: 200 },
    );
  }
}
