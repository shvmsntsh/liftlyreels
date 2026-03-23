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
import { AudioEngine } from "@/lib/audio-engine";
import { Volume2, VolumeX } from "lucide-react";

type AudioContextType = {
  isPlaying: boolean;
  currentCategory: string | null;
  trackLabel: string;
  play: (category: string, trackId?: string | null) => void;
  pause: () => void;
  toggle: () => void;
};

const Ctx = createContext<AudioContextType>({
  isPlaying: false,
  currentCategory: null,
  trackLabel: "",
  play: () => {},
  pause: () => {},
  toggle: () => {},
});

export function useAudio() {
  return useContext(Ctx);
}

const AUDIO_PAGES = ["/feed", "/explore"];

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const engineRef = useRef<AudioEngine | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [trackLabel, setTrackLabel] = useState("");
  const userEnabledRef = useRef(true);
  const unlockedRef = useRef(false);
  const wantedRef = useRef<{ category: string; trackId?: string | null } | null>(null);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  function getEngine(): AudioEngine {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
    }
    return engineRef.current;
  }

  // Bind DOM <audio> element to engine on mount
  const audioRefCallback = useCallback((el: HTMLAudioElement | null) => {
    audioElRef.current = el;
    if (el) {
      getEngine().setElement(el);
    }
  }, []);

  // Load stored preference
  useEffect(() => {
    const stored = localStorage.getItem("liftly-audio");
    if (stored === "off") {
      userEnabledRef.current = false;
    } else {
      userEnabledRef.current = true;
      if (!stored) localStorage.setItem("liftly-audio", "on");
    }
  }, []);

  // Unlock audio on first user gesture (iOS)
  useEffect(() => {
    if (unlockedRef.current) return;

    function unlock() {
      if (unlockedRef.current) return;
      const engine = getEngine();
      // unlock() is synchronous — must be called inside the gesture handler directly
      engine.unlock();
      unlockedRef.current = true;

      const w = wantedRef.current;
      if (
        w &&
        userEnabledRef.current &&
        AUDIO_PAGES.includes(pathnameRef.current)
      ) {
        engine.play(w.category, w.trackId).then((ok) => {
          if (ok) {
            setIsPlaying(true);
            setCurrentCategory(w.category);
            setTrackLabel(engine.trackLabel);
          }
        });
      }
    }

    const events = ["touchstart", "touchend", "click", "keydown"];
    events.forEach((e) =>
      document.addEventListener(e, unlock, { once: true, passive: true })
    );
    return () => events.forEach((e) => document.removeEventListener(e, unlock));
  }, []);

  // Pause when leaving audio pages — always call pause() regardless of isPlaying flag
  useEffect(() => {
    if (!AUDIO_PAGES.includes(pathname)) {
      engineRef.current?.pause();
      setIsPlaying(false);
    }
  }, [pathname]);

  // Pause when tab is hidden / app backgrounded; resume when tab comes back
  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        engineRef.current?.pause();
        setIsPlaying(false);
      } else if (
        AUDIO_PAGES.includes(pathnameRef.current) &&
        userEnabledRef.current &&
        wantedRef.current
      ) {
        // Coming back to tab while on feed/explore — resume last track
        const engine = engineRef.current;
        const w = wantedRef.current;
        if (engine && w) {
          engine.play(w.category, w.trackId).then((ok) => {
            setIsPlaying(ok);
            if (ok) {
              setCurrentCategory(w.category);
              setTrackLabel(engine.trackLabel);
            }
          });
        }
      }
    }

    function onPageHide() {
      engineRef.current?.pause();
      setIsPlaying(false);
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  const play = useCallback(
    (category: string, trackId?: string | null) => {
      if (!AUDIO_PAGES.includes(pathnameRef.current)) return;

      wantedRef.current = { category, trackId };
      setCurrentCategory(category);

      if (!userEnabledRef.current) return;

      const engine = getEngine();
      engine.play(category, trackId).then((ok) => {
        setIsPlaying(ok);
        if (ok) {
          setCurrentCategory(category);
          setTrackLabel(engine.trackLabel);
        }
      });
    },
    []
  );

  const pause = useCallback(() => {
    engineRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    const engine = getEngine();

    if (userEnabledRef.current) {
      engine.pause();
      setIsPlaying(false);
      userEnabledRef.current = false;
      localStorage.setItem("liftly-audio", "off");
    } else {
      userEnabledRef.current = true;
      localStorage.setItem("liftly-audio", "on");

      // Unlock synchronously inside this click handler
      engine.unlock();
      unlockedRef.current = true;

      const w = wantedRef.current;
      if (w && AUDIO_PAGES.includes(pathnameRef.current)) {
        engine.play(w.category, w.trackId).then((ok) => {
          setIsPlaying(ok);
          if (ok) {
            setCurrentCategory(w.category);
            setTrackLabel(engine.trackLabel);
          }
        });
      }
    }
  }, []);

  const showToggle = AUDIO_PAGES.includes(pathname);

  return (
    <Ctx.Provider
      value={{ isPlaying, currentCategory, trackLabel, play, pause, toggle }}
    >
      {children}
      {/* DOM-rendered <audio> element for iOS Safari compatibility */}
      <audio
        ref={audioRefCallback}
        loop
        playsInline
        preload="auto"
        style={{ display: "none" }}
      />
      {showToggle && (
        <AudioToggleButton
          isPlaying={isPlaying}
          label={trackLabel}
          toggle={toggle}
        />
      )}
    </Ctx.Provider>
  );
}

function AudioToggleButton({
  isPlaying,
  label,
  toggle,
}: {
  isPlaying: boolean;
  label: string;
  toggle: () => void;
}) {
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
        boxShadow: isPlaying ? "0 0 12px rgba(56,189,248,0.2)" : "none",
      }}
      aria-label={isPlaying ? "Mute audio" : "Play audio"}
    >
      {isPlaying ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
      <span>{isPlaying ? label || "Sound" : "Sound"}</span>
    </button>
  );
}
