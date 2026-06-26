import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 p-8 text-center">
      <h1 className="text-5xl font-bold tracking-tight">Wiki Pic Race</h1>
      <p className="text-lg text-gray-500">
        Race across Wikipedia by <strong>pictures, not words</strong>. Click images to hop from the
        start article to the target in as few hops as you can.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/race?seed=test"
          className="rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:opacity-80"
        >
          Play demo race
        </Link>
        <Link
          href="/race"
          className="rounded-lg border border-black px-6 py-3 font-semibold transition hover:bg-gray-100"
        >
          Random race
        </Link>
      </div>
    </main>
  );
}
