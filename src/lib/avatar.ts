// Deterministic initials "sticker" avatar as a data-URI. The guaranteed visual fallback whenever
// a person has no resolved photo (live tiles, the target/current chips, and the seeded demo).

function hueFor(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export function initialsAvatar(name: string, hue?: number): string {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
  const h = hue ?? hueFor(name);
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>` +
    `<circle cx='100' cy='100' r='100' fill='hsl(${h},55%,55%)'/>` +
    `<text x='100' y='120' font-family='sans-serif' font-size='60' font-weight='700' ` +
    `fill='white' text-anchor='middle'>${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
