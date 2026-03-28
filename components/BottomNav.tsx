"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, Zap, User } from "lucide-react";

const items = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/create", icon: Plus, label: "Create", accent: true },
  { href: "/challenge", icon: Zap, label: "Act" },
  { href: "/profile/me", icon: User, label: "Me" },
];

export function BottomNav({ streak }: { streak?: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[100]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div
        className="flex items-stretch justify-around"
        style={{
          background: "var(--nav-bg)",
          borderTop: "1px solid var(--nav-border)",
        }}
      >
        {items.map(({ href, icon: Icon, label, accent }) => {
          const isActive =
            pathname === href ||
            (href === "/profile/me" && pathname?.startsWith("/profile")) ||
            (href === "/feed" && pathname === "/feed") ||
            (href === "/search" && (pathname === "/search" || pathname === "/explore")) ||
            (href === "/challenge" && pathname === "/challenge");

          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 tap-highlight"
              style={{ minHeight: "56px" }}
            >
              {accent ? (
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  style={{
                    background: "linear-gradient(135deg, #38bdf8, #2563eb)",
                    boxShadow: "0 4px 14px rgba(56,189,248,0.35)",
                  }}
                >
                  <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
              ) : (
                <>
                  {isActive && (
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-b-full"
                      style={{ background: "var(--nav-text-active)" }}
                    />
                  )}
                  <div className="relative">
                    <Icon
                      className="h-6 w-6"
                      style={{ color: isActive ? "var(--nav-text-active)" : "var(--nav-text)" }}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                    {label === "Act" && streak != null && streak > 0 && (
                      <span className="absolute -top-1.5 -right-3 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold leading-none text-white">
                        {streak}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: isActive ? "var(--nav-text-active)" : "var(--nav-text)" }}
                  >
                    {label}
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
