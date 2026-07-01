"use client";
/* eslint-disable @next/next/no-img-element */

// Sticker-book board: each linked person is a circular cutout portrait, scattered on a jittered
// grid with a little rotation (deterministic per title, so it never jiggles between renders).
// Titles are hidden; hover straightens the sticker and peeks the name.

import type { Tile } from "@/lib/board";

// Stable 32-bit hash -> [0,1) pseudo-random, salted so one title yields many independent draws.
function rnd(str: string, salt: string): number {
  let h = 2166136261;
  const s = str + salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export default function StickerBoard({
  tiles,
  onPick,
}: {
  tiles: readonly Tile[];
  onPick: (title: string) => void;
}) {
  const n = tiles.length;
  if (n === 0) return null;

  const cols = Math.max(3, Math.min(6, Math.ceil(Math.sqrt(n * 1.4))));
  const rows = Math.ceil(n / cols);

  return (
    <div
      className="relative w-full rounded-2xl border bg-muted/30 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px]"
      style={{ aspectRatio: `${cols} / ${rows}`, minHeight: 320 }}
    >
      {tiles.map((t, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cw = 100 / cols;
        const ch = 100 / rows;
        const left = (col + 0.5) * cw + (rnd(t.title, "x") - 0.5) * cw * 0.55;
        const top = (row + 0.5) * ch + (rnd(t.title, "y") - 0.5) * ch * 0.55;
        const rot = (rnd(t.title, "r") - 0.5) * 34;
        const width = cw * (0.78 + rnd(t.title, "s") * 0.22);

        return (
          <div
            key={`${t.title}-${i}`}
            className="group absolute aspect-square -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 ease-out hover:!z-[999] hover:scale-[1.18]"
            style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, zIndex: i }}
          >
            <button
              type="button"
              data-testid="tile"
              data-title={t.title}
              data-type={t.type}
              data-blank={t.image ? "false" : "true"}
              onClick={() => onPick(t.title)}
              aria-label={t.title}
              className="h-full w-full cursor-pointer overflow-hidden rounded-full border-4 border-background bg-muted shadow-[0_6px_16px_rgba(0,0,0,0.18)] outline-none ring-ring/50 transition-[transform,box-shadow] duration-200 ease-out group-hover:rotate-0 group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.28)] focus-visible:ring-4"
              style={{ transform: `rotate(${rot}deg)` }}
            >
              {t.image ? (
                <img src={t.image} alt="" className="h-full w-full object-cover" draggable={false} />
              ) : (
                <span className="flex h-full w-full items-center justify-center p-2 text-center text-xs font-medium text-muted-foreground">
                  {t.title}
                </span>
              )}
            </button>
            <span className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-0.5 text-xs font-medium text-background opacity-0 shadow transition-opacity duration-150 group-hover:opacity-100">
              {t.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}
