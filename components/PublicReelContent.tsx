"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

const PREVIEW_POINT_LIMIT = 3;
const LONG_POINT_HINT = 180;

type Props = {
  title: string;
  content: string[];
};

export function PublicReelContent({ title, content }: Props) {
  const [open, setOpen] = useState(false);

  const previewPoints = useMemo(
    () => content.slice(0, PREVIEW_POINT_LIMIT),
    [content]
  );
  const hasHiddenPoints = content.length > PREVIEW_POINT_LIMIT;
  const lastPreviewIndex = previewPoints.length - 1;
  const lastPreviewPoint = previewPoints[lastPreviewIndex] ?? "";
  const hasLongLastPoint = lastPreviewPoint.length > LONG_POINT_HINT;
  const hasTruncatedPreview = hasHiddenPoints || hasLongLastPoint;

  if (content.length === 0) return null;

  return (
    <>
      <div className="mb-6 w-full space-y-3">
        {previewPoints.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold text-white">
              {i + 1}
            </span>
            <p
              className={clsx(
                "text-sm leading-relaxed text-white/90",
                i === lastPreviewIndex && hasTruncatedPreview && "line-clamp-4"
              )}
            >
              {item}
            </p>
          </div>
        ))}

        {hasTruncatedPreview && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-bold text-sky-300 backdrop-blur-sm transition hover:bg-white/10"
          >
            View More
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full"
            aria-label="Close full reel"
          />

          <div className="absolute bottom-0 left-0 right-0 mx-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col rounded-t-3xl border-t border-white/10 bg-[rgba(8,15,30,0.98)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                  Full Reel
                </p>
                <h3 className="mt-1 line-clamp-2 text-sm font-bold text-white">
                  {title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-3 rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto px-4 py-4">
              {content.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 px-3.5 py-3"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/8 text-[10px] font-bold text-white/55">
                    {i + 1}
                  </span>
                  <p className="text-[14px] leading-[1.6] text-white/92">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
