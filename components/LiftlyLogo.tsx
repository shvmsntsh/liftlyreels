"use client";

import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

type Props = {
  size?: number;
  animate?: boolean;
  className?: string;
};

/** The canonical Liftly logomark — a bold check whose upstroke becomes a rising arrow.
 *  Enclosed in a rounded-square with emerald→sky gradient. Used app-wide. */
export function LiftlyLogo({ size = 48, animate: shouldAnimate = false, className = "" }: Props) {
  const controls = useAnimation();

  useEffect(() => {
    if (!shouldAnimate) return;
    controls.start({
      pathLength: 1,
      opacity: 1,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number,number,number,number], delay: 0.1 },
    });
  }, [shouldAnimate, controls]);

  const r = size * 0.27; // corner radius ≈ 27% of size

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-label="Liftly"
    >
      <defs>
        <linearGradient id="liftly-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="liftly-mark" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.85)" />
        </linearGradient>
        <filter id="liftly-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background rounded square */}
      <rect
        x="1"
        y="1"
        width="46"
        height="46"
        rx={r}
        fill="url(#liftly-bg)"
      />
      {/* Subtle inner shadow/glow */}
      <rect
        x="1"
        y="1"
        width="46"
        height="46"
        rx={r}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />

      {/* Check-arrow mark: bold, centered */}
      {shouldAnimate ? (
        <g filter="url(#liftly-glow)">
          <motion.path
            d="M 11 26 L 20 35 L 37 11"
            stroke="url(#liftly-mark)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={controls}
          />
          <motion.path
            d="M 37 11 L 30 10.5 M 37 11 L 37 18"
            stroke="url(#liftly-mark)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.85 } }}
          />
        </g>
      ) : (
        <g filter="url(#liftly-glow)">
          <path
            d="M 11 26 L 20 35 L 37 11"
            stroke="url(#liftly-mark)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M 37 11 L 30 10.5 M 37 11 L 37 18"
            stroke="url(#liftly-mark)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      )}
    </svg>
  );
}
