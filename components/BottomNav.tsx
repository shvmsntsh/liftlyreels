"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, Flame, User } from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/create", icon: PlusCircle, label: "Create", accent: true },
  { href: "/challenge", icon: Flame, label: "Challenge" },
  { href: "/profile/me", icon: User, label: "Profile" },
];

export function BottomNav({ streak }: { streak?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 mx-auto max-w-md">
      <div className="mx-3 mb-3 flex items-center justify-around rounded-2xl border border-white/10 bg-slate-950/85 px-2 py-3 backdrop-blur-xl shadow-2xl shadow-black/50">
        {items.map(({ href, icon: Icon, label, accent }) => {
          const isActive =
            pathname === href ||
            (href === "/profile/me" && pathname.startsWith("/profile"));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all",
                isActive ? "text-sky-300" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {accent ? (
                <div
                  className={clsx(
                    "flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 border border-sky-400/30",
                    isActive && "bg-sky-500/40 border-sky-400/60"
                  )}
                >
                  <Icon className="h-5 w-5 text-sky-300" />
                </div>
              ) : (
                <>
                  <Icon className={clsx("h-5 w-5", isActive && "fill-current")} />
                  <span className="text-[10px] font-medium">
                    {label === "Challenge" && streak && streak > 0
                      ? `🔥 ${streak}`
                      : label}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
