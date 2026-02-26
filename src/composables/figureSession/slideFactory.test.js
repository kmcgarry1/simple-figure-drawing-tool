import { describe, expect, it } from "vitest";
import { SESSION_PHOTO_LIMIT } from "../../config";
import { createClassSlides, createQuickSlides } from "./slideFactory";

function makePhotos(count) {
  return Array.from({ length: count }, (_, index) => ({
    name: `photo-${index + 1}.jpg`,
    size: index + 1,
    lastModified: index + 10
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
    const sourcePhotos = [
      { name: "A.jpg", size: 11, lastModified: 101 },
      { name: "B.jpg", size: 22, lastModified: 202 }
    ];
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
        poseCount: 3,
        photoTag: "all"
      }
    ]);
    expect(slides.map((slide) => slide.file.name)).toEqual(["A.jpg", "B.jpg", "A.jpg"]);
    expect(slides.map((slide) => slide.durationMs)).toEqual([30000, 30000, 30000]);
    expect(slides.map((slide) => slide.poseNumber)).toEqual([1, 2, 3]);
  });

  it("filters class blocks by assigned photo tags", () => {
    const sourcePhotos = [
      { name: "gesture-a.jpg", size: 10, lastModified: 1 },
      { name: "longpose-a.jpg", size: 20, lastModified: 2 },
      { name: "gesture-b.jpg", size: 30, lastModified: 3 }
    ];
    const { slides } = createClassSlides({
      sourcePhotos,
      classBlocks: [
        { label: "Gesture", durationSeconds: 30, poseCount: 2, photoTag: "gesture" },
        { label: "Long Pose", durationSeconds: 300, poseCount: 1, photoTag: "long-pose" }
      ],
      classPhotoOrder: "sequential",
      avoidImmediateRepeats: true,
      photoTagsById: {
        "gesture-a.jpg|10|1": "gesture",
        "longpose-a.jpg|20|2": "long-pose",
        "gesture-b.jpg|30|3": "gesture"
      }
    });

    expect(slides.map((slide) => slide.file.name)).toEqual([
      "gesture-a.jpg",
      "gesture-b.jpg",
      "longpose-a.jpg"
    ]);
  });
});
