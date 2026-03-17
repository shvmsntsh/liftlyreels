"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Grid2x2, House } from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/feed", label: "Feed", icon: House },
  { href: "/categories", label: "Categories", icon: Grid2x2 },
  { href: "/saved", label: "Saved", icon: Bookmark },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-white/10 bg-slate-950/92 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
      <div className="mx-auto grid grid-cols-3 gap-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-col items-center justify-center rounded-2xl px-3 py-2 text-xs font-medium transition",
                active
                  ? "bg-sky-400/15 text-sky-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="mb-1 h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
