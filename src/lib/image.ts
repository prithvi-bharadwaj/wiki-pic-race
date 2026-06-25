// Image resolution for a tile (GDD §3a): REST summary -> pageimages -> typed placeholder.
// REST summary surfaces non-free posters/crests that `pageimages` drops; placeholder is the
// guaranteed fallback (UI renders a typed text tile when url is null).

export type ImageSource = "rest" | "pageimages" | "placeholder";

export type ResolvedImage = { url: string | null; source: ImageSource };

export type ImageInputs = {
  restThumb?: string | null;
  pageImageThumb?: string | null;
};

export function pickImage({ restThumb, pageImageThumb }: ImageInputs): ResolvedImage {
  if (restThumb) return { url: restThumb, source: "rest" };
  if (pageImageThumb) return { url: pageImageThumb, source: "pageimages" };
  return { url: null, source: "placeholder" };
}
