"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Tile } from "@/lib/board";
import { SEED, seedImg } from "@/lib/seed";

type Props = { seed?: string; start?: string; target?: string };
type Board = { type: string; tiles: Tile[] };

export default function RaceClient({ seed, start, target }: Props) {
  const isSeed = seed === "test";

  const [startTitle, setStartTitle] = useState<string | null>(isSeed ? SEED.start : start ?? null);
  const [targetTitle, setTargetTitle] = useState<string | null>(isSeed ? SEED.target : target ?? null);
  const [current, setCurrent] = useState<string | null>(isSeed ? SEED.start : start ?? null);
  const [board, setBoard] = useState<Board | null>(null);
  const [hops, setHops] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [won, setWon] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);

  // Random race: fetch a start/target pair when none was supplied.
  useEffect(() => {
    if (isSeed || (startTitle && targetTitle)) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/random");
        const data = (await res.json()) as { start: string; target: string };
        if (cancelled) return;
        setStartTitle(data.start);
        setTargetTitle(data.target);
        setCurrent(data.start);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSeed, startTitle, targetTitle]);

  // Load the board for the current article.
  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    (async () => {
      if (isSeed) {
        const page = SEED.pages[current];
        setBoard(page ? { type: page.type, tiles: page.tiles } : { type: "other", tiles: [] });
        return;
      }
      try {
        const res = await fetch(`/api/board?title=${encodeURIComponent(current)}`);
        if (!res.ok) throw new Error(`board ${res.status}`);
        if (!cancelled) setBoard((await res.json()) as Board);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [current, isSeed]);

  // Timer.
  useEffect(() => {
    if (won) return;
    if (startedAt.current === null) startedAt.current = Date.now();
    const id = setInterval(() => {
      if (startedAt.current !== null) setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [won]);

  const move = useCallback(
    (to: string) => {
      setCurrent(to);
      setHops((h) => h + 1);
      if (to === targetTitle) setWon(true);
    },
    [targetTitle],
  );

  if (won) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-8 text-center">
        <div data-testid="win" className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-bold">You reached {targetTitle}! 🏁</h1>
          <p className="text-xl">
            {hops} hops · {elapsed}s
          </p>
        </div>
        <Link href="/" className="rounded-lg bg-black px-6 py-3 font-semibold text-white">
          Play again
        </Link>
      </main>
    );
  }

  const targetImage = isSeed && targetTitle ? seedImg(targetTitle, 0) : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <Link href="/" className="text-sm text-gray-400 hover:underline">
          ← Wiki Pic Race
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Get to</span>
          {targetImage ? (
            <img
              data-testid="target-image"
              src={targetImage}
              alt=""
              className="h-10 w-10 rounded object-cover"
            />
          ) : null}
          <span data-testid="target-name" className="text-lg font-bold">
            {targetTitle ?? "…"}
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <span>
            Hops: <span data-testid="hops" className="font-bold">{hops}</span>
          </span>
          <span className="tabular-nums">{elapsed}s</span>
        </div>
      </header>

      <p className="text-sm text-gray-400">
        From <span className="font-medium">{startTitle ?? "…"}</span> — click a picture to hop. Hover
        to peek at what it is.
      </p>

      {error ? <p className="text-red-500">Error: {error}</p> : null}

      {board ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {board.tiles.map((t, i) => (
            <button
              key={`${t.title}-${i}`}
              data-testid="tile"
              data-title={t.title}
              data-type={t.type}
              data-blank={t.image ? "false" : "true"}
              onClick={() => move(t.title)}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-gray-100"
            >
              {t.image ? (
                <img src={t.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center p-1 text-center text-xs text-gray-600">
                  {t.title}
                </span>
              )}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/70 p-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                {t.title}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">Loading…</p>
      )}
    </main>
  );
}
