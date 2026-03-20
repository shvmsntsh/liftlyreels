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
  const [userEnabled, setUserEnabled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("liftly-audio");
    if (stored === "on") setUserEnabled(true);
  }, []);

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
      // Only allow audio on feed/explore
      if (!AUDIO_PAGES.includes(pathname)) return;

      if (!userEnabled) {
        setCurrentCategory(category);
        return;
      }

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
      audio.volume = 0.3;
      audioRef.current = audio;
      audio.play().catch(() => {});
      setCurrentCategory(category);
      setIsPlaying(true);
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
      // turning off
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      setIsPlaying(false);
      setUserEnabled(false);
      localStorage.setItem("liftly-audio", "off");
    } else {
      // turning on
      setUserEnabled(true);
      localStorage.setItem("liftly-audio", "on");
      if (currentCategory && AUDIO_PAGES.includes(pathname)) {
        const info = getAudioForCategory(currentCategory);
        if (info?.url) {
          const audio = new Audio(info.url);
          audio.loop = true;
          audio.volume = 0.3;
          audioRef.current = audio;
          audio.play().catch(() => {});
          setIsPlaying(true);
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
        "fixed right-4 z-40 flex items-center gap-1.5 rounded-full border px-3 py-2 text-[10px] font-semibold transition-all tap-highlight",
        "top-[max(3rem,env(safe-area-inset-top,3rem))]",
        isPlaying
          ? "border-sky-400/30 bg-sky-500/15 text-sky-300 backdrop-blur-xl shadow-[0_0_12px_rgba(56,189,248,0.15)]"
          : "border-white/10 bg-black/40 text-white/50 backdrop-blur-xl"
      )}
      aria-label={isPlaying ? "Mute audio" : "Play audio"}
    >
      {isPlaying ? (
        <Volume2 className="h-3.5 w-3.5" />
      ) : (
        <VolumeX className="h-3.5 w-3.5" />
      )}
      <span>{isPlaying ? currentCategory : "Sound"}</span>
    </button>
  );
}
