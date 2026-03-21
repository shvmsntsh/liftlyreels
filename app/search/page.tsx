"use client";

import { Suspense } from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowLeft, User, Film, Hash } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { BottomNav } from "@/components/BottomNav";
import { UserAvatar } from "@/components/UserAvatar";
import { REEL_GRADIENTS } from "@/lib/types";

type SearchPost = {
  id: string;
  title: string;
  category: string;
  gradient: string;
  tags: string[];
  is_user_created: boolean;
  created_at: string;
  profiles?: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
};

type SearchUser = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  vibe_score: number;
  bio: string | null;
};

type Tab = "all" | "posts" | "users";

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const initialTag = searchParams.get("tag") ?? "";

  const [query, setQuery] = useState(initialTag ? `#${initialTag}` : initialQuery);
  const [tab, setTab] = useState<Tab>("all");
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-search if arriving with a tag
  useEffect(() => {
    if (initialTag) {
      doSearch(initialTag, "posts");
      setTab("posts");
    } else if (initialQuery) {
      doSearch(initialQuery, "all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doSearch(q: string, type: Tab) {
    const clean = q.startsWith("#") ? q.slice(1) : q;
    if (clean.length < 2) {
      setPosts([]);
      setUsers([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(clean)}&type=${type === "all" ? "all" : type}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
      setUsers(data.users ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function handleInput(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value, tab), 350);
  }

  function handleTabChange(t: Tab) {
    setTab(t);
    doSearch(query, t);
  }

  const showPosts = tab === "all" || tab === "posts";
  const showUsers = tab === "all" || tab === "users";
  const hasResults = posts.length > 0 || users.length > 0;
  const hasQuery = query.replace("#", "").trim().length >= 2;

  return (
    <main className="relative min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-xl">
        <div className="mx-auto max-w-md px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)]"
            >
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => handleInput(e.target.value)}
                placeholder="Search reels, tags, or people..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] py-2.5 pl-9 pr-9 text-sm text-foreground placeholder:text-muted outline-none focus:border-[var(--accent)]/40"
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setPosts([]); setUsers([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-3 flex gap-1">
            {(["all", "posts", "users"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={clsx(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition capitalize",
                  tab === t
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-muted hover:text-foreground"
                )}
              >
                {t === "posts" && <Film className="h-3 w-3" />}
                {t === "users" && <User className="h-3 w-3" />}
                {t === "all" && <Search className="h-3 w-3" />}
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-4">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <motion.div
              className="h-6 w-6 rounded-full border-2 border-[var(--accent)] border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}

        {/* Empty state */}
        {!loading && !hasQuery && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-16 text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)]">
              <Search className="h-6 w-6 text-muted" />
            </div>
            <p className="text-sm font-medium text-foreground">Search Liftly</p>
            <p className="mt-1 text-xs text-muted">
              Find reels by title, #tag, or discover people
            </p>
          </motion.div>
        )}

        {/* No results */}
        {!loading && hasQuery && !hasResults && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-16 text-center"
          >
            <p className="text-sm font-medium text-foreground">No results</p>
            <p className="mt-1 text-xs text-muted">
              Try different keywords or browse by category
            </p>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence mode="popLayout">
          {!loading && (
            <motion.div
              key={query + tab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Users */}
              {showUsers && users.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                    People
                  </p>
                  <div className="space-y-2">
                    {users.map((u) => (
                      <Link
                        key={u.id}
                        href={`/profile/${u.username}`}
                        className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-3 transition hover:bg-[var(--surface-2)]"
                      >
                        <UserAvatar username={u.username} avatarUrl={u.avatar_url} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">
                            {u.display_name ?? u.username}
                          </p>
                          <p className="text-xs text-muted">@{u.username}</p>
                          {u.bio && (
                            <p className="mt-0.5 text-xs text-muted truncate">{u.bio}</p>
                          )}
                        </div>
                        <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent)]">
                          {u.vibe_score} Vibe
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts */}
              {showPosts && posts.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                    Reels
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {posts.map((p) => {
                      const g = REEL_GRADIENTS[p.gradient ?? "ocean"] ?? REEL_GRADIENTS.ocean;
                      const author = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
                      const matchedTags = p.tags?.filter((t) =>
                        t.toLowerCase().includes(query.replace("#", "").toLowerCase())
                      );
                      return (
                        <Link key={p.id} href={`/feed#${p.id}`}>
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative overflow-hidden rounded-2xl"
                            style={{ aspectRatio: "3/4", background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <span className="text-[10px] uppercase tracking-wider text-sky-300">
                                {p.category}
                              </span>
                              <p className="text-xs font-bold text-white line-clamp-2 leading-4">
                                {p.title}
                              </p>
                              {matchedTags && matchedTags.length > 0 && (
                                <div className="mt-1 flex gap-1 flex-wrap">
                                  {matchedTags.slice(0, 2).map((t) => (
                                    <span key={t} className="flex items-center gap-0.5 text-[9px] text-sky-300/80">
                                      <Hash className="h-2 w-2" />{t}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {author && (
                                <p className="mt-1 text-[10px] text-white/50">
                                  @{author.username}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </main>
  );
}
