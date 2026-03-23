"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { CommentRecord } from "@/lib/types";
import { UserAvatar } from "./UserAvatar";

type Props = {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  commentsCount: number;
  onCountChange: (n: number) => void;
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export function CommentsSheet({ postId, isOpen, onClose, commentsCount, onCountChange }: Props) {
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`/api/comments?postId=${postId}`)
      .then((r) => r.json())
      .then((data) => {
        setComments(data.comments ?? []);
        onCountChange(data.comments?.length ?? 0);
      })
      .finally(() => setLoading(false));
  }, [isOpen, postId]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    }
  }, [isOpen, comments.length]);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: text.trim() }),
      });
      const data = await res.json();
      if (data.comment) {
        setComments((prev) => [...prev, data.comment]);
        onCountChange(comments.length + 1);
        setText("");
      } else {
        setSendError(data.error ?? "Failed to post comment. Please try again.");
      }
    } catch {
      setSendError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[105] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[110] mx-auto max-w-md rounded-t-3xl backdrop-blur-xl"
            style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-base font-semibold text-white">
                Comments {commentsCount > 0 && <span className="text-slate-400">({commentsCount})</span>}
              </h3>
              <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-3 space-y-4">
              {loading ? (
                <div className="py-8 text-center text-slate-500 text-sm">Loading...</div>
              ) : comments.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No comments yet. Be the first to share a thought.
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <UserAvatar
                      username={c.profile?.username ?? "?"}
                      avatarUrl={c.profile?.avatar_url}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-white">
                          {c.profile?.display_name ?? c.profile?.username ?? "User"}
                        </span>
                        <span className="text-[10px] text-slate-500">{timeAgo(c.created_at)}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-200 leading-5">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {sendError && (
              <p className="px-5 py-1.5 text-[12px] text-rose-400 bg-rose-500/10">{sendError}</p>
            )}
            <div className="px-4 py-3 pb-safe" style={{ borderTop: "1px solid var(--border)" }}>
              <div
                className="flex items-center gap-2 rounded-2xl px-3 py-2"
                style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 200))}
                  placeholder="Add a positive thought..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <span className="text-[10px] text-slate-600">{text.length}/200</span>
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-white disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
