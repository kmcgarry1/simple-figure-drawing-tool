import { describe, expect, it } from "vitest";
import {
  clampDurationSeconds,
  createPhotoId,
  movePhotoById,
  movePhotoByIdToIndex,
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

  it("rejects files with explicitly disallowed mime types even if extension looks valid", () => {
    const { photos, notices } = normalizeUploadedPhotos([
      {
        name: "looks-safe.jpg",
        type: "image/svg+xml",
        size: 1024,
        lastModified: 10
      }
    ]);

    expect(photos).toHaveLength(0);
    expect(notices.join(" ")).toContain("unsupported image type");
  });
});

describe("createPhotoId", () => {
  it("creates a stable id from file metadata", () => {
    const photoId = createPhotoId({
      name: "pose-1.jpg",
      size: 1024,
      lastModified: 42
    });

    expect(photoId).toBe("pose-1.jpg|1024|42");
  });
});

describe("movePhotoById", () => {
  const photos = [
    { name: "pose-1.jpg", size: 1, lastModified: 11 },
    { name: "pose-2.jpg", size: 2, lastModified: 22 },
    { name: "pose-3.jpg", size: 3, lastModified: 33 }
  ];

  it("moves a photo up and down in the list", () => {
    const upResult = movePhotoById(photos, "pose-2.jpg|2|22", "up");
    expect(upResult.moved).toBe(true);
    expect(upResult.photos.map((photo) => photo.name)).toEqual([
      "pose-2.jpg",
      "pose-1.jpg",
      "pose-3.jpg"
    ]);

    const downResult = movePhotoById(photos, "pose-2.jpg|2|22", "down");
    expect(downResult.moved).toBe(true);
    expect(downResult.photos.map((photo) => photo.name)).toEqual([
      "pose-1.jpg",
      "pose-3.jpg",
      "pose-2.jpg"
    ]);
  });

  it("supports top and bottom moves", () => {
    const topResult = movePhotoById(photos, "pose-3.jpg|3|33", "top");
    expect(topResult.moved).toBe(true);
    expect(topResult.photos.map((photo) => photo.name)).toEqual([
      "pose-3.jpg",
      "pose-1.jpg",
      "pose-2.jpg"
    ]);

    const bottomResult = movePhotoById(photos, "pose-1.jpg|1|11", "bottom");
    expect(bottomResult.moved).toBe(true);
    expect(bottomResult.photos.map((photo) => photo.name)).toEqual([
      "pose-2.jpg",
      "pose-3.jpg",
      "pose-1.jpg"
    ]);
  });

  it("does not move when direction is invalid or target photo is missing", () => {
    expect(movePhotoById(photos, "missing|0|0", "up").moved).toBe(false);
    expect(movePhotoById(photos, "pose-2.jpg|2|22", "weird").moved).toBe(false);
  });
});

describe("movePhotoByIdToIndex", () => {
  const photos = [
    { name: "pose-1.jpg", size: 1, lastModified: 11 },
    { name: "pose-2.jpg", size: 2, lastModified: 22 },
    { name: "pose-3.jpg", size: 3, lastModified: 33 }
  ];

  it("moves a photo directly to the requested target index", () => {
    const result = movePhotoByIdToIndex(photos, "pose-1.jpg|1|11", 2);
    expect(result.moved).toBe(true);
    expect(result.fromIndex).toBe(0);
    expect(result.toIndex).toBe(2);
    expect(result.photos.map((photo) => photo.name)).toEqual([
      "pose-2.jpg",
      "pose-3.jpg",
      "pose-1.jpg"
    ]);
  });

  it("does not move when target index is invalid, unchanged, or photo is missing", () => {
    expect(movePhotoByIdToIndex(photos, "pose-2.jpg|2|22", 1).moved).toBe(false);
    expect(movePhotoByIdToIndex(photos, "pose-2.jpg|2|22", -1).moved).toBe(false);
    expect(movePhotoByIdToIndex(photos, "pose-2.jpg|2|22", 99).moved).toBe(false);
    expect(movePhotoByIdToIndex(photos, "missing|0|0", 1).moved).toBe(false);
  });
});
