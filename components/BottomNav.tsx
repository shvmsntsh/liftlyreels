"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Plus, Zap, User } from "lucide-react";
import clsx from "clsx";

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
      className="fixed bottom-0 inset-x-0 z-30 mx-auto max-w-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div
        className="mx-2 mb-2 flex items-center justify-around rounded-[22px] px-1 py-1.5"
        style={{
          backgroundColor: "rgba(8, 15, 30, 0.92)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.06)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
        }}
      >
        {items.map(({ href, icon: Icon, label, accent }) => {
          const isActive =
            pathname === href ||
            (href === "/profile/me" && pathname?.startsWith("/profile")) ||
            (href === "/challenge" && pathname === "/challenge") ||
            (href === "/feed" && pathname === "/feed") ||
            (href === "/explore" && pathname === "/explore");

          if (accent) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 tap-highlight"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_4px_16px_rgba(56,189,248,0.35)]">
                  <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-0.5 px-4 py-2 tap-highlight min-w-[52px]"
            >
              <div className="relative">
                <Icon
                  className={clsx(
                    "h-[22px] w-[22px] transition-colors duration-150",
                    isActive ? "text-sky-300" : "text-slate-400"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {label === "Challenge" && streak && streak > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold leading-none text-white">
                    {streak}
                  </span>
                )}
              </div>
              <span
                className={clsx(
                  "text-[10px] font-semibold tracking-wide transition-colors duration-150",
                  isActive ? "text-sky-300" : "text-slate-500"
                )}
              >
                {label}
              </span>
              {isActive && (
                <div
                  className="absolute -top-0.5 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-sky-400"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
