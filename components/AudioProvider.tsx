"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getAudioForCategory } from "@/lib/audio";
import { Volume2, VolumeX } from "lucide-react";

type AudioContextType = {
  isPlaying: boolean;
  currentCategory: string | null;
  play: (category: string) => void;
  pause: () => void;
  toggle: () => void;
};

const Ctx = createContext<AudioContextType>({
  isPlaying: false,
  currentCategory: null,
  play: () => {},
  pause: () => {},
  toggle: () => {},
});

export function useAudio() {
  return useContext(Ctx);
}

const AUDIO_PAGES = ["/feed", "/explore"];

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [userEnabled, setUserEnabled] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const wantedCategoryRef = useRef<string | null>(null);
  const pathname = usePathname();

  // Load stored preference
  useEffect(() => {
    const stored = localStorage.getItem("liftly-audio");
    if (stored === "off") {
      setUserEnabled(false);
    } else {
      setUserEnabled(true);
      if (!stored) localStorage.setItem("liftly-audio", "on");
    }
  }, []);

  // Unlock audio on first user gesture (required by iOS Safari)
  useEffect(() => {
    if (unlocked) return;
    function unlock() {
      const el = audioRef.current;
      if (el) {
        // Play a silent frame to unlock the audio element on iOS
        el.muted = true;
        el.play().then(() => {
          el.pause();
          el.muted = false;
          el.currentTime = 0;
          setUnlocked(true);
          // If there's a pending category, start playing now
          const cat = wantedCategoryRef.current;
          if (cat && userEnabled && AUDIO_PAGES.includes(pathname)) {
            const info = getAudioForCategory(cat);
            if (info?.url) {
              el.src = info.url;
              el.play().then(() => setIsPlaying(true)).catch(() => {});
            }
          }
        }).catch(() => {});
      }
    }
    const events = ["touchstart", "touchend", "click", "keydown"];
    events.forEach((e) => document.addEventListener(e, unlock, { once: true, passive: true }));
    return () => events.forEach((e) => document.removeEventListener(e, unlock));
  }, [unlocked, userEnabled, pathname]);

  // Pause when leaving audio pages
  useEffect(() => {
    if (!AUDIO_PAGES.includes(pathname)) {
      const el = audioRef.current;
      if (el && !el.paused) {
        el.pause();
        setIsPlaying(false);
      }
    }
  }, [pathname]);

  const play = useCallback(
    (category: string) => {
      if (!AUDIO_PAGES.includes(pathname)) return;
      setCurrentCategory(category);
      wantedCategoryRef.current = category;

      if (!userEnabled) return;

      const el = audioRef.current;
      if (!el) return;

      // Already playing this category
      if (currentCategory === category && !el.paused) return;

      const info = getAudioForCategory(category);
      if (!info?.url) return;

      el.src = info.url;
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    },
    [userEnabled, currentCategory, pathname]
  );

  const pause = useCallback(() => {
    const el = audioRef.current;
    if (el) el.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (userEnabled) {
      if (el) el.pause();
      setIsPlaying(false);
      setUserEnabled(false);
      localStorage.setItem("liftly-audio", "off");
    } else {
      setUserEnabled(true);
      setUnlocked(true); // User just tapped — audio is unlocked
      localStorage.setItem("liftly-audio", "on");
      const cat = currentCategory || wantedCategoryRef.current;
      if (cat && el && AUDIO_PAGES.includes(pathname)) {
        const info = getAudioForCategory(cat);
        if (info?.url) {
          el.src = info.url;
          el.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }
    }
  }, [userEnabled, currentCategory, pathname]);

  const showToggle = AUDIO_PAGES.includes(pathname);

  return (
    <Ctx.Provider value={{ isPlaying, currentCategory, play, pause, toggle }}>
      {/* Single persistent audio element — iOS requires a DOM element, not new Audio() */}
      <audio ref={audioRef} loop playsInline preload="none" style={{ display: "none" }} />
      {children}
      {showToggle && <AudioToggleButton />}
    </Ctx.Provider>
  );
}

function AudioToggleButton() {
  const { isPlaying, toggle, currentCategory } = useAudio();

  return (
    <button
      onClick={toggle}
      className="fixed right-4 z-[90] flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-[11px] font-semibold transition-all tap-highlight"
      style={{
        top: "max(3rem, env(safe-area-inset-top, 3rem))",
        background: isPlaying ? "var(--accent-soft)" : "rgba(0,0,0,0.4)",
        color: isPlaying ? "var(--accent)" : "rgba(255,255,255,0.6)",
        border: `1px solid ${isPlaying ? "var(--accent-soft)" : "rgba(255,255,255,0.1)"}`,
      }}
      aria-label={isPlaying ? "Mute audio" : "Play audio"}
    >
      {isPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      <span>{isPlaying ? currentCategory : "Sound"}</span>
    </button>
  );
}
