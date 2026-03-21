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
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-2xl",
};

const emojiSizeMap = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-3xl",
};

// Default avatar presets — gradient backgrounds with emojis
export const DEFAULT_AVATARS = [
  { id: "emoji:fire", emoji: "\u{1F525}", gradient: "from-orange-500 to-red-600" },
  { id: "emoji:bolt", emoji: "\u{26A1}", gradient: "from-amber-400 to-orange-500" },
  { id: "emoji:rocket", emoji: "\u{1F680}", gradient: "from-sky-400 to-blue-600" },
  { id: "emoji:gem", emoji: "\u{1F48E}", gradient: "from-violet-400 to-purple-600" },
  { id: "emoji:star", emoji: "\u{1F31F}", gradient: "from-yellow-400 to-amber-500" },
  { id: "emoji:target", emoji: "\u{1F3AF}", gradient: "from-rose-400 to-pink-600" },
  { id: "emoji:brain", emoji: "\u{1F9E0}", gradient: "from-pink-400 to-rose-500" },
  { id: "emoji:muscle", emoji: "\u{1F4AA}", gradient: "from-emerald-400 to-green-600" },
  { id: "emoji:wave", emoji: "\u{1F30A}", gradient: "from-cyan-400 to-sky-600" },
  { id: "emoji:flower", emoji: "\u{1F338}", gradient: "from-pink-300 to-rose-400" },
  { id: "emoji:lion", emoji: "\u{1F981}", gradient: "from-amber-500 to-orange-600" },
  { id: "emoji:crown", emoji: "\u{1F451}", gradient: "from-yellow-500 to-amber-600" },
];

function getEmojiPreset(avatarUrl: string) {
  return DEFAULT_AVATARS.find((a) => a.id === avatarUrl);
}

export function UserAvatar({ username, avatarUrl, size = "md", className }: Props) {
  const initial = username?.[0]?.toUpperCase() ?? "?";

  // Emoji preset avatar
  if (avatarUrl?.startsWith("emoji:")) {
    const preset = getEmojiPreset(avatarUrl);
    if (preset) {
      return (
        <div
          className={clsx(
            "flex items-center justify-center rounded-full shrink-0 bg-gradient-to-br",
            sizeMap[size],
            preset.gradient,
            className
          )}
        >
          <span className={emojiSizeMap[size]}>{preset.emoji}</span>
        </div>
      );
    }
  }

  // Image URL avatar
  if (avatarUrl && !avatarUrl.startsWith("emoji:")) {
    return (
      <div className={clsx("relative rounded-full overflow-hidden shrink-0", sizeMap[size], className)}>
        <Image src={avatarUrl} alt={username} fill className="object-cover" />
      </div>
    );
  }

  // Letter fallback
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
