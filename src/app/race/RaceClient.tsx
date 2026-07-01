"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Tile } from "@/lib/board";
import { SEED } from "@/lib/seed";
import { initialsAvatar } from "@/lib/avatar";
import { buttonVariants } from "@/components/ui/button";
import StickerBoard from "./StickerBoard";

type Props = { seed?: string; start?: string; target?: string };
type Board = { type: string; tiles: Tile[]; selfImage?: string | null };

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
  const [targetImg, setTargetImg] = useState<string | null>(
    isSeed && targetTitle ? initialsAvatar(targetTitle) : null,
  );
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

  // Resolve the target's own image in live mode (seed mode already has one).
  useEffect(() => {
    if (isSeed || !targetTitle) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/image?title=${encodeURIComponent(targetTitle)}`);
        const data = (await res.json()) as { url: string | null };
        if (!cancelled) setTargetImg(data.url);
      } catch {
        // header falls back to name-only
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSeed, targetTitle]);

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
    async (to: string) => {
      if (!current) return;
      try {
        const res = await fetch("/api/move", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ from: current, to, seed }),
        });
        if (!res.ok) {
          setError("That face isn't on this page — pick another.");
          return;
        }
      } catch (e) {
        setError(String(e));
        return;
      }
      setError(null);
      setCurrent(to);
      setHops((h) => h + 1);
      if (to === targetTitle) setWon(true);
    },
    [current, targetTitle, seed],
  );

  if (won) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-8 text-center">
        <div data-testid="win" className="flex flex-col items-center gap-4">
          <div className="text-6xl">🏁</div>
          <h1 className="text-4xl font-bold tracking-tight">You reached {targetTitle}!</h1>
          <p className="text-xl text-muted-foreground">
            {hops} hops · {elapsed}s
          </p>
        </div>
        <Link href="/" className={buttonVariants({ className: "h-11 px-6 text-base" })}>
          Play again
        </Link>
      </main>
    );
  }

  const currentImg = current ? (board?.selfImage ?? initialsAvatar(current)) : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-5 p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          ← Wiki Pic Race
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Reach</span>
          {targetTitle ? (
            <img
              data-testid="target-image"
              src={targetImg ?? initialsAvatar(targetTitle)}
              alt=""
              className="h-11 w-11 rounded-full border-2 border-background object-cover shadow"
            />
          ) : null}
          <span data-testid="target-name" className="text-lg font-bold">
            {targetTitle ?? "…"}
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <span>
            Hops: <span data-testid="hops" className="font-bold tabular-nums">{hops}</span>
          </span>
          <span className="tabular-nums text-muted-foreground">{elapsed}s</span>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>You&rsquo;re on</span>
          {currentImg ? (
            <span className="inline-flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3">
              <img src={currentImg} alt="" className="h-7 w-7 rounded-full object-cover" />
              <span data-testid="current-name" className="font-semibold text-foreground">
                {current}
              </span>
            </span>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          These are people linked from{" "}
          <span className="font-medium text-foreground">{current ?? "…"}</span>&rsquo;s Wikipedia
          article. Hover a face to see who they are, then click to travel — reach{" "}
          <span className="font-medium text-foreground">{targetTitle ?? "…"}</span>.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {board ? (
        <StickerBoard tiles={board.tiles} onPick={move} />
      ) : (
        <p className="text-muted-foreground">Finding faces&hellip;</p>
      )}
    </main>
  );
}
