import { BottomNav } from "@/components/BottomNav";
import { SavedPostsClient } from "@/components/SavedPostsClient";
import { SectionHeader } from "@/components/SectionHeader";
import { getPosts } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const posts = await getPosts();

  return (
    <main className="relative mx-auto h-screen max-w-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-slate-950 via-slate-950/80 to-transparent pb-8">
        <SectionHeader
          eyebrow="Library"
          title="Saved"
          description="Anything you bookmark stays here. Until then, we keep a few strong lessons visible."
        />
      </div>
      <SavedPostsClient posts={posts} />
      <BottomNav />
    </main>
  );
}
