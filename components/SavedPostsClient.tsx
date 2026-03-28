"use client";

import { useEffect, useMemo, useState } from "react";
import { PostRecord } from "@/lib/types";
import { ReelCard } from "@/components/ReelCard";
import { SAVED_POSTS_KEY, readStoredIds } from "@/utils/storage";

type SavedPostsClientProps = {
  posts: PostRecord[];
};

export function SavedPostsClient({ posts }: SavedPostsClientProps) {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setSavedIds(readStoredIds(SAVED_POSTS_KEY));

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const savedPosts = useMemo(() => {
    const filtered = posts.filter((post) => savedIds.includes(post.id));
    return filtered.length ? filtered : posts.slice(0, 3);
  }, [posts, savedIds]);

  return (
    <div className="snap-y-mandatory h-[100dvh] overflow-y-auto">
      {savedPosts.map((post) => (
        <ReelCard key={post.id} post={post} />
      ))}
    </div>
  );
}
