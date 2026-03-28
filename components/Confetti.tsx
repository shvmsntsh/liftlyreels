"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Particle = {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speed: number;
  spin: number;
};

const COLORS = [
  "#10b981", // emerald
  "#f59e0b", // amber
  "#38bdf8", // sky
  "#a855f7", // purple
  "#f43f5e", // rose
  "#84cc16", // lime
];

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 40 + Math.random() * 20, // cluster near center top
    y: 30 + Math.random() * 10,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 6,
    angle: -90 + (Math.random() - 0.5) * 180,
    speed: 300 + Math.random() * 400,
    spin: (Math.random() - 0.5) * 720,
  }));
}

type Props = {
  show: boolean;
  count?: number;
};

export function Confetti({ show, count = 40 }: Props) {
  const particles = useRef(makeParticles(count));

  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-[500] overflow-hidden">
          {particles.current.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const dx = Math.cos(rad) * p.speed;
            const dy = Math.sin(rad) * p.speed;

            return (
              <motion.div
                key={p.id}
                className="absolute rounded-sm"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size * 0.5,
                  background: p.color,
                  transformOrigin: "center",
                }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: dx,
                  y: dy,
                  opacity: [1, 1, 0],
                  rotate: p.spin,
                }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
