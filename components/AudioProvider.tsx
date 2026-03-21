"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getAudioForCategory } from "@/lib/audio";
import { Volume2, VolumeX } from "lucide-react";
import clsx from "clsx";

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [userEnabled, setUserEnabled] = useState(true); // Default ON
  const [hasInteracted, setHasInteracted] = useState(false);
  const pendingCategoryRef = useRef<string | null>(null);
  const pathname = usePathname();

  // Load stored preference (default to "on" for new users)
  useEffect(() => {
    const stored = localStorage.getItem("liftly-audio");
    if (stored === "off") {
      setUserEnabled(false);
    } else {
      setUserEnabled(true);
      // Set to "on" for new users who haven't toggled yet
      if (!stored) localStorage.setItem("liftly-audio", "on");
    }
  }, []);

  // Listen for first user interaction to unlock audio playback
  useEffect(() => {
    if (hasInteracted) return;

    function onInteract() {
      setHasInteracted(true);
      // If there's a pending category to play, start it now
      if (pendingCategoryRef.current && userEnabled) {
        const info = getAudioForCategory(pendingCategoryRef.current);
        if (info?.url && AUDIO_PAGES.includes(pathname)) {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current = null;
          }
          const audio = new Audio(info.url);
          audio.loop = true;
          audio.volume = 0.25;
          audioRef.current = audio;
          audio.play().catch(() => {});
          setIsPlaying(true);
        }
      }
    }

    const events = ["touchstart", "click", "keydown", "scroll"];
    events.forEach((e) => document.addEventListener(e, onInteract, { once: true, passive: true }));
    return () => {
      events.forEach((e) => document.removeEventListener(e, onInteract));
    };
  }, [hasInteracted, userEnabled, pathname]);

  // Auto-pause when leaving audio-eligible pages
  useEffect(() => {
    if (!AUDIO_PAGES.includes(pathname)) {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [pathname]);

  const play = useCallback(
    (category: string) => {
      if (!AUDIO_PAGES.includes(pathname)) return;

      setCurrentCategory(category);
      pendingCategoryRef.current = category;

      if (!userEnabled) return;

      const info = getAudioForCategory(category);
      if (!info?.url) return;

      if (currentCategory === category && audioRef.current && !audioRef.current.paused) {
        return;
      }

      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }

      const audio = new Audio(info.url);
      audio.loop = true;
      audio.volume = 0.25;
      audioRef.current = audio;

      const playPromise = audio.play();
      if (playPromise) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay blocked — will retry on user interaction via hasInteracted handler
            setIsPlaying(false);
          });
      }
    },
    [userEnabled, currentCategory, pathname]
  );

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (userEnabled) {
      // Turning off
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      setIsPlaying(false);
      setUserEnabled(false);
      localStorage.setItem("liftly-audio", "off");
    } else {
      // Turning on
      setUserEnabled(true);
      setHasInteracted(true); // User just clicked, so we have interaction
      localStorage.setItem("liftly-audio", "on");
      const cat = currentCategory || pendingCategoryRef.current;
      if (cat && AUDIO_PAGES.includes(pathname)) {
        const info = getAudioForCategory(cat);
        if (info?.url) {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current = null;
          }
          const audio = new Audio(info.url);
          audio.loop = true;
          audio.volume = 0.25;
          audioRef.current = audio;
          audio.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }
    }
  }, [userEnabled, currentCategory, pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const showToggle = AUDIO_PAGES.includes(pathname);

  return (
    <Ctx.Provider value={{ isPlaying, currentCategory, play, pause, toggle }}>
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
      className={clsx(
        "fixed right-4 z-40 flex items-center gap-1.5 rounded-full border px-3.5 py-2.5 text-[11px] font-semibold transition-all tap-highlight",
        "top-[max(3rem,env(safe-area-inset-top,3rem))]",
        isPlaying
          ? "border-sky-400/30 bg-sky-500/15 text-sky-300 backdrop-blur-xl shadow-[0_0_12px_rgba(56,189,248,0.15)]"
          : "border-white/15 bg-black/50 text-white/60 backdrop-blur-xl"
      )}
      aria-label={isPlaying ? "Mute audio" : "Play audio"}
    >
      {isPlaying ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
      <span>{isPlaying ? currentCategory : "Sound"}</span>
    </button>
  );
}
