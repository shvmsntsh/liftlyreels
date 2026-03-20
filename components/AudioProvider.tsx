"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getAudioForCategory } from "@/lib/audio";

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

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [userEnabled, setUserEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("liftly-audio");
    if (stored === "on") setUserEnabled(true);
  }, []);

  const play = useCallback(
    (category: string) => {
      if (!userEnabled) {
        setCurrentCategory(category);
        return;
      }

      const info = getAudioForCategory(category);
      if (!info?.url) return;

      if (currentCategory === category && audioRef.current && !audioRef.current.paused) {
        return; // already playing same category
      }

      // Fade out if playing
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(info.url);
      audio.loop = true;
      audio.volume = 0.3;
      audioRef.current = audio;
      audio.play().catch(() => {});
      setCurrentCategory(category);
      setIsPlaying(true);
    },
    [userEnabled, currentCategory]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (userEnabled) {
      // turning off
      audioRef.current?.pause();
      setIsPlaying(false);
      setUserEnabled(false);
      localStorage.setItem("liftly-audio", "off");
    } else {
      // turning on
      setUserEnabled(true);
      localStorage.setItem("liftly-audio", "on");
      if (currentCategory) {
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
  }, [userEnabled, currentCategory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  return (
    <Ctx.Provider value={{ isPlaying, currentCategory, play, pause, toggle }}>
      {children}
    </Ctx.Provider>
  );
}
