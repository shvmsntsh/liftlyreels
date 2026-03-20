"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useAudio } from "./AudioProvider";
import clsx from "clsx";

export function AudioToggle() {
  const { isPlaying, toggle, currentCategory } = useAudio();

  return (
    <button
      onClick={toggle}
      className={clsx(
        "fixed right-4 top-12 z-40 flex items-center gap-1.5 rounded-full border px-3 py-2 text-[10px] font-semibold transition-all tap-highlight",
        isPlaying
          ? "border-sky-400/30 bg-sky-500/15 text-sky-300 backdrop-blur-xl shadow-[0_0_12px_rgba(56,189,248,0.2)]"
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
