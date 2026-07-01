import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 p-8 text-center">
      <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">Wiki Pic Race</h1>
      <p className="text-lg text-muted-foreground">
        Hop from <strong className="text-foreground">face to face</strong> across Wikipedia. Start on
        one person, race to another — clicking only portraits, never words. Fewest hops wins.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/race?seed=test" className={buttonVariants({ className: "h-11 px-6 text-base" })}>
          Play demo race
        </Link>
        <Link
          href="/race"
          className={buttonVariants({ variant: "outline", className: "h-11 px-6 text-base" })}
        >
          Random race
        </Link>
      </div>
    </main>
  );
}
