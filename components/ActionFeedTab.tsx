"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "./UserAvatar";

type ActionEntry = {
  id: string;
  user_id: string;
  post_id: string | null;
  action_taken: string;
  created_at: string;
  is_own: boolean;
  actor: { username: string; display_name: string | null; avatar_url: string | null };
  post: { title: string; gradient: string | null; category: string } | null;
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

const GRADIENT_COLORS: Record<string, string> = {
  ocean: "from-sky-500 to-blue-600",
  sunset: "from-orange-400 to-rose-500",
  forest: "from-emerald-500 to-teal-600",
  fire: "from-red-500 to-orange-500",
  aurora: "from-violet-500 to-purple-600",
  gold: "from-amber-400 to-yellow-500",
};

export function ActionFeedTab() {
  const [actions, setActions] = useState<ActionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/feed/actions")
      .then((r) => r.json())
      .then((d) => setActions(d.actions ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <motion.div
          className="h-8 w-8 rounded-full border-2 border-white/20 border-t-emerald-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <CheckCircle className="h-8 w-8" />
        </div>
        <p className="text-base font-semibold text-foreground">No proof yet</p>
        <p className="mt-2 text-sm text-slate-500">
          When you or people you follow tap &quot;I Did This&quot; on a reel, it shows here.
        </p>
        <p className="mt-1 text-xs text-slate-600">Follow more people to see their wins.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-4 py-4">
      {actions.map((action, i) => {
        const gradient = action.post?.gradient ?? "ocean";
        const gradientClass = GRADIENT_COLORS[gradient] ?? "from-emerald-500 to-teal-600";
        const name = action.actor.display_name ?? action.actor.username;

        return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, type: "spring", damping: 24, stiffness: 300 }}
            className="overflow-hidden rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm"
          >
            {/* Post gradient accent bar */}
            {action.post && (
              <div className={`h-1 w-full bg-gradient-to-r ${gradientClass}`} />
            )}

            <div className="p-4">
              {/* Actor row */}
              <div className="flex items-start gap-3">
                <button
                  onClick={() => router.push(`/profile/${action.actor.username}`)}
                  className="shrink-0"
                >
                  <UserAvatar
                    username={action.actor.username}
                    avatarUrl={action.actor.avatar_url}
                    size="md"
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => router.push(`/profile/${action.actor.username}`)}
                      className="text-sm font-semibold text-foreground"
                    >
                      {action.is_own ? "You" : name}
                    </button>
                    <span className="text-[10px] text-slate-600 shrink-0">{timeAgo(action.created_at)}</span>
                  </div>
                  {action.post && (
                    <button
                      onClick={() => action.post_id && router.push(`/feed#${action.post_id}`)}
                      className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-400"
                    >
                      <Zap className="h-3 w-3 text-emerald-400" />
                      {action.post.title}
                    </button>
                  )}
                </div>
              </div>

              {/* Action text */}
              <div className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-950/25 px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <p className="text-sm leading-snug text-slate-200">{action.action_taken}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
