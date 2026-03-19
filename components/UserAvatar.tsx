"use client";

import Image from "next/image";
import clsx from "clsx";

type Props = {
  username: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-14 w-14 text-xl",
};

export function UserAvatar({ username, avatarUrl, size = "md", className }: Props) {
  const initial = username?.[0]?.toUpperCase() ?? "?";

  if (avatarUrl) {
    return (
      <div className={clsx("relative rounded-full overflow-hidden shrink-0", sizeMap[size], className)}>
        <Image src={avatarUrl} alt={username} fill className="object-cover" />
      </div>
    );
  }

  const colors = [
    "bg-sky-500", "bg-violet-500", "bg-amber-500",
    "bg-emerald-500", "bg-rose-500", "bg-cyan-500",
  ];
  const color = colors[username.charCodeAt(0) % colors.length];

  return (
    <div
      className={clsx(
        "flex items-center justify-center rounded-full shrink-0 font-bold text-white",
        sizeMap[size],
        color,
        className
      )}
    >
      {initial}
    </div>
  );
}
