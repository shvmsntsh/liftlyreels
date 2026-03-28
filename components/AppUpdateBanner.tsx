"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X, CheckCircle2 } from "lucide-react";
import { BUILD_VERSION } from "@/lib/version";

const POLL_INTERVAL = 60_000; // 1 minute

type VersionData = {
  version: string;
  number: string;
  date: string;
  changes: string[];
};

export function AppUpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [changelog, setChangelog] = useState<VersionData | null>(null);
  const [showChangelog, setShowChangelog] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // On mount — check if we just updated (sessionStorage flag)
  useEffect(() => {
    const justUpdated = sessionStorage.getItem("liftly-just-updated");
    if (justUpdated) {
      sessionStorage.removeItem("liftly-just-updated");
      // Show changelog popup
      fetch("/api/version")
        .then((r) => r.json())
        .then((data: VersionData) => {
          setChangelog(data);
          setShowChangelog(true);
          setTimeout(() => setShowChangelog(false), 5000);
        })
        .catch(() => null);
    }
  }, []);

  // On mount — detect if BUILD_VERSION changed since last visit (new deploy)
  useEffect(() => {
    const STORAGE_KEY = "liftly-last-seen-version";
    const lastSeen = localStorage.getItem(STORAGE_KEY);

    // First ever visit — store version silently, no popup
    if (!lastSeen) {
      localStorage.setItem(STORAGE_KEY, BUILD_VERSION);
      return;
    }

    // Same version as last visit — nothing to show
    if (lastSeen === BUILD_VERSION) return;

    // New deployment detected — update stored version
    localStorage.setItem(STORAGE_KEY, BUILD_VERSION);

    // Skip if the "just-updated" flow already handles it
    if (sessionStorage.getItem("liftly-just-updated")) return;

    // Show changelog popup for this new version
    fetch("/api/version")
      .then((r) => r.json())
      .then((data: VersionData) => {
        setChangelog(data);
        setShowChangelog(true);
        setTimeout(() => setShowChangelog(false), 5000);
      })
      .catch(() => null);
  }, []);

  // Poll for version changes
  useEffect(() => {
    function poll() {
      fetch("/api/version")
        .then((r) => r.json())
        .then((data: VersionData) => {
          if (data.version && data.version !== BUILD_VERSION) {
            setChangelog(data);
            setUpdateAvailable(true);
            // Stop polling once found
            if (pollingRef.current) clearInterval(pollingRef.current);
          }
        })
        .catch(() => null);
    }

    // Start polling after 30s delay (avoid false positives on first load)
    const startDelay = setTimeout(() => {
      poll();
      pollingRef.current = setInterval(poll, POLL_INTERVAL);
    }, 30_000);

    return () => {
      clearTimeout(startDelay);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  function handleUpdate() {
    sessionStorage.setItem("liftly-just-updated", "1");
    window.location.reload();
  }

  return (
    <>
      {/* ── Update available banner ── */}
      <AnimatePresence>
        {updateAvailable && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-[200] flex items-center gap-3 bg-sky-600 px-4 py-3 shadow-lg"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <RefreshCw className="h-4 w-4 shrink-0 text-white" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white leading-tight">
                {changelog?.number ?? "New version"} is available
              </p>
              <p className="text-[11px] text-sky-100/80 truncate">
                {changelog?.changes?.[0] ?? "Tap to refresh"}
              </p>
            </div>
            <button
              onClick={handleUpdate}
              className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-sky-600 active:scale-95 transition-transform"
            >
              Update
            </button>
            <button
              onClick={() => setUpdateAvailable(false)}
              className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-white/15"
            >
              <X className="h-3.5 w-3.5 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Post-update changelog popup ── */}
      <AnimatePresence>
        {showChangelog && changelog && (
          <motion.div
            className="fixed left-4 right-4 z-[200] rounded-2xl border border-emerald-400/20 bg-black/90 p-5 shadow-2xl backdrop-blur-xl"
            style={{ bottom: "calc(var(--nav-height) + var(--safe-bottom) + 1rem)" }}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-[13px] font-black text-white">
                  {changelog.number} — What&apos;s new
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/40">{changelog.date}</span>
                <button
                  onClick={() => setShowChangelog(false)}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10"
                >
                  <X className="h-3 w-3 text-white/50" />
                </button>
              </div>
            </div>

            <ul className="space-y-1.5">
              {changelog.changes.slice(0, 5).map((change, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-400 text-[11px]">✦</span>
                  <span className="text-[12px] text-white/75 leading-snug">{change}</span>
                </li>
              ))}
            </ul>

            {/* Auto-close progress bar */}
            <motion.div
              className="mt-4 h-[2px] rounded-full bg-emerald-500/60"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
