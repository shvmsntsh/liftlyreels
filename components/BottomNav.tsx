"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Plus, Zap, User } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";

const items = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/create", icon: Plus, label: "Create", accent: true },
  { href: "/challenge", icon: Zap, label: "Challenge" },
  { href: "/profile/me", icon: User, label: "Me" },
];

export function BottomNav({ streak }: { streak?: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 mx-auto max-w-md tap-highlight"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div
        className="mx-3 mb-3 flex items-center justify-around rounded-[26px] px-1 py-2 backdrop-blur-2xl"
        style={{
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.06)",
        }}
      >
        {items.map(({ href, icon: Icon, label, accent }) => {
          const isActive =
            pathname === href ||
            (href === "/profile/me" && pathname === "/profile/me") ||
            (href === "/challenge" && pathname === "/challenge");

          if (accent) {
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-1 px-2 py-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_2px_8px_rgba(56,189,248,0.25)]">
                  <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-1 px-4 py-1"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-1 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: "var(--accent)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <div className="relative">
                <Icon
                  className={clsx(
                    "h-5 w-5 transition-colors duration-150",
                    isActive ? "text-sky-300" : "text-slate-500"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {label === "Challenge" && streak && streak > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-orange-500 px-1 text-[8px] font-bold leading-none text-white">
                    {streak}
                  </span>
                )}
              </div>
              <span
                className={clsx(
                  "text-[9.5px] font-semibold tracking-wide transition-colors duration-150",
                  isActive ? "text-sky-300" : "text-slate-600"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
