"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { AmbientEngine, CATEGORY_LABELS } from "@/lib/audio-engine";
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
  const engineRef = useRef<AmbientEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const userEnabledRef = useRef(true);
  const [userEnabled, setUserEnabled] = useState(true);
  const unlockedRef = useRef(false);
  const wantedCategoryRef = useRef<string | null>(null);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // Lazy-init the engine
  function getEngine(): AmbientEngine {
    if (!engineRef.current) {
      engineRef.current = new AmbientEngine();
    }
    return engineRef.current;
  }

  // Load stored preference
  useEffect(() => {
    const stored = localStorage.getItem("liftly-audio");
    if (stored === "off") {
      setUserEnabled(false);
      userEnabledRef.current = false;
    } else {
      setUserEnabled(true);
      userEnabledRef.current = true;
      if (!stored) localStorage.setItem("liftly-audio", "on");
    }
  }, []);

  // Unlock audio on first user gesture (required by iOS Safari)
  useEffect(() => {
    if (unlockedRef.current) return;

    function unlock() {
      const engine = getEngine();
      engine.unlock().then(() => {
        unlockedRef.current = true;
        // If there's a pending category and user wants sound, start playing
        const cat = wantedCategoryRef.current;
        if (
          cat &&
          userEnabledRef.current &&
          AUDIO_PAGES.includes(pathnameRef.current)
        ) {
          engine.play(cat).then((ok) => {
            if (ok) {
              setIsPlaying(true);
              setCurrentCategory(cat);
            }
          });
        }
      });
    }

    const events = ["touchstart", "touchend", "click", "keydown"];
    events.forEach((e) =>
      document.addEventListener(e, unlock, { once: true, passive: true })
    );
    return () => events.forEach((e) => document.removeEventListener(e, unlock));
  }, []);

  // Pause when leaving audio pages
  useEffect(() => {
    if (!AUDIO_PAGES.includes(pathname)) {
      const engine = engineRef.current;
      if (engine?.isPlaying) {
        engine.pause();
        setIsPlaying(false);
      }
    }
  }, [pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  const play = useCallback((category: string) => {
    if (!AUDIO_PAGES.includes(pathnameRef.current)) return;

    wantedCategoryRef.current = category;
    setCurrentCategory(category);

    if (!userEnabledRef.current) return;

    const engine = getEngine();

    // Already playing this category
    if (engine.isPlaying && engine.currentCategory === category) return;

    engine.play(category).then((ok) => {
      setIsPlaying(ok);
      if (ok) setCurrentCategory(category);
    });
  }, []);

  const pause = useCallback(() => {
    engineRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    const engine = getEngine();

    if (userEnabledRef.current) {
      // Turn OFF
      engine.pause();
      setIsPlaying(false);
      setUserEnabled(false);
      userEnabledRef.current = false;
      localStorage.setItem("liftly-audio", "off");
    } else {
      // Turn ON — user just tapped, so audio is unlocked
      setUserEnabled(true);
      userEnabledRef.current = true;
      unlockedRef.current = true;
      localStorage.setItem("liftly-audio", "on");

      const cat =
        wantedCategoryRef.current ||
        currentCategory ||
        null;

      if (cat && AUDIO_PAGES.includes(pathnameRef.current)) {
        // unlock + play in response to user gesture
        engine.unlock().then(() => {
          engine.play(cat).then((ok) => {
            setIsPlaying(ok);
            if (ok) setCurrentCategory(cat);
          });
        });
      }
    }
  }, [currentCategory]);

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
  const label = isPlaying
    ? CATEGORY_LABELS[currentCategory ?? ""] ?? currentCategory
    : "Sound";

  return (
    <button
      onClick={toggle}
      className="fixed right-4 z-[90] flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-[11px] font-semibold transition-all tap-highlight backdrop-blur-xl"
      style={{
        top: "max(3rem, env(safe-area-inset-top, 3rem))",
        background: isPlaying
          ? "rgba(56,189,248,0.15)"
          : "rgba(0,0,0,0.4)",
        color: isPlaying ? "rgb(125,211,252)" : "rgba(255,255,255,0.6)",
        border: `1px solid ${
          isPlaying ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.1)"
        }`,
        boxShadow: isPlaying
          ? "0 0 12px rgba(56,189,248,0.2)"
          : "none",
      }}
      aria-label={isPlaying ? "Mute audio" : "Play audio"}
    >
      {isPlaying ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
      <span>{label}</span>
    </button>
  );
}
