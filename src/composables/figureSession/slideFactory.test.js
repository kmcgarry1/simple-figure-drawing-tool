import { describe, expect, it } from "vitest";
import { SESSION_PHOTO_LIMIT } from "../../config";
import { createClassSlides, createQuickSlides } from "./slideFactory";

function makePhotos(count) {
  return Array.from({ length: count }, (_, index) => ({
    name: `photo-${index + 1}.jpg`
  }));
}

describe("createQuickSlides", () => {
  it("caps quick slides to the configured photo limit", () => {
    const photos = makePhotos(SESSION_PHOTO_LIMIT + 5);
    const durationSeconds = 45;

    const { slides, selectedPhotosCount } = createQuickSlides(photos, durationSeconds);

    expect(selectedPhotosCount).toBe(SESSION_PHOTO_LIMIT);
    expect(slides).toHaveLength(SESSION_PHOTO_LIMIT);
    expect(slides[0]).toMatchObject({
      durationSeconds: 45,
      durationMs: 45000,
      label: "Gesture Pose",
      poseNumber: 1
    });
  });
});

describe("createClassSlides", () => {
  it("builds deterministic sequence in sequential mode", () => {
    const sourcePhotos = [{ name: "A.jpg" }, { name: "B.jpg" }];
    const { slides, safeBlocks, poseCount } = createClassSlides({
      sourcePhotos,
      classBlocks: [{ label: "Warm-up", durationSeconds: 30, poseCount: 3 }],
      classPhotoOrder: "sequential",
      avoidImmediateRepeats: true
    });

    expect(poseCount).toBe(3);
    expect(safeBlocks).toEqual([
      {
        label: "Warm-up",
        durationSeconds: 30,
        poseCount: 3
      }
    ]);
    expect(slides.map((slide) => slide.file.name)).toEqual(["A.jpg", "B.jpg", "A.jpg"]);
    expect(slides.map((slide) => slide.durationMs)).toEqual([30000, 30000, 30000]);
    expect(slides.map((slide) => slide.poseNumber)).toEqual([1, 2, 3]);
  });
});
