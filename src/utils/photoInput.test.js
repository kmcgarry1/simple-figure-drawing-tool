import { describe, expect, it } from "vitest";
import {
  clampDurationSeconds,
  normalizeUploadedPhotos
} from "./photoInput";
import {
  DEFAULT_DURATION_SECONDS,
  MAX_DURATION_SECONDS,
  MIN_DURATION_SECONDS
} from "../config";

describe("clampDurationSeconds", () => {
  it("returns default when input is invalid", () => {
    expect(clampDurationSeconds("not-a-number")).toBe(DEFAULT_DURATION_SECONDS);
  });

  it("clamps to configured min and max", () => {
    expect(clampDurationSeconds(MIN_DURATION_SECONDS - 999)).toBe(MIN_DURATION_SECONDS);
    expect(clampDurationSeconds(MAX_DURATION_SECONDS + 999)).toBe(MAX_DURATION_SECONDS);
  });
});

describe("normalizeUploadedPhotos", () => {
  it("accepts supported images and reports rejected files", () => {
    const files = [
      {
        name: "pose-1.jpg",
        type: "image/jpeg",
        size: 1024,
        lastModified: 1
      },
      {
        name: "pose-2.webp",
        type: "",
        size: 2048,
        lastModified: 2
      },
      {
        name: "vector.svg",
        type: "image/svg+xml",
        size: 1024,
        lastModified: 3
      },
      {
        name: "too-big.png",
        type: "image/png",
        size: 26 * 1024 * 1024,
        lastModified: 4
      },
      {
        name: "pose-1.jpg",
        type: "image/jpeg",
        size: 1024,
        lastModified: 1
      }
    ];

    const { photos, notices } = normalizeUploadedPhotos(files);

    expect(photos).toHaveLength(2);
    expect(photos.map((file) => file.name)).toEqual(["pose-1.jpg", "pose-2.webp"]);
    expect(notices.join(" ")).toContain("unsupported image type");
    expect(notices.join(" ")).toContain("larger than 25MB");
    expect(notices.join(" ")).toContain("duplicate file(s) ignored");
  });
});
