import { describe, it, expect } from "vitest";
import { pickImage } from "./image";

describe("pickImage (REST -> pageimages -> placeholder)", () => {
  it("prefers the REST summary thumb (covers non-free posters/crests)", () => {
    expect(pickImage({ restThumb: "rest.jpg", pageImageThumb: "pi.jpg" })).toEqual({
      url: "rest.jpg",
      source: "rest",
    });
  });

  it("falls back to pageimages when REST is absent", () => {
    expect(pickImage({ restThumb: null, pageImageThumb: "pi.jpg" })).toEqual({
      url: "pi.jpg",
      source: "pageimages",
    });
  });

  it("falls back to a placeholder when neither exists", () => {
    expect(pickImage({ restThumb: null, pageImageThumb: null })).toEqual({
      url: null,
      source: "placeholder",
    });
  });
});
