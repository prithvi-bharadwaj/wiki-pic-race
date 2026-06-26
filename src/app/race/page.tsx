import RaceClient from "./RaceClient";

export default async function RacePage({
  searchParams,
}: {
  searchParams: Promise<{ seed?: string; start?: string; target?: string }>;
}) {
  const sp = await searchParams;
  return <RaceClient seed={sp.seed} start={sp.start} target={sp.target} />;
}
