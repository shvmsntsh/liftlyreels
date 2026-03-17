import { BottomNav } from "@/components/BottomNav";
import { ReelCard } from "@/components/ReelCard";
import { getPosts } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const posts = await getPosts();

  return (
    <main className="relative mx-auto h-screen max-w-md">
      <div className="snap-y-mandatory h-screen overflow-y-auto">
        {posts.map((post) => (
          <ReelCard key={post.id} post={post} />
        ))}
      </div>
      <BottomNav />
    </main>
  );
}
