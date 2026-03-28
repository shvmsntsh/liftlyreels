"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LiftlyLogo } from "./LiftlyLogo";

export function SplashScreen() {
  const [show, setShow] = useState(false);
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    // Only show splash once per session (tab open / refresh)
    if (sessionStorage.getItem("liftly-splash-shown")) {
      setAnimating(false);
      return;
    }
    sessionStorage.setItem("liftly-splash-shown", "1");
    setShow(true);

    // Auto-dismiss after 2 seconds
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!animating) return null;

  return (
    <AnimatePresence onExitComplete={() => setAnimating(false)}>
      {show && (
        <motion.div
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
          style={{ background: "#080f1e" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {/* Logo with draw animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            <LiftlyLogo size={80} animate />
          </motion.div>

          {/* App name */}
          <motion.h1
            className="mt-4 text-3xl font-black tracking-tight text-white"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            Liftly
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="mt-2 text-[13px] text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          >
            Stop scrolling. Start proving.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
