import { describe, expect, it } from "vitest";
import { SESSION_PHOTO_LIMIT } from "../../config";
import {
  applyClassPoseFilesToSlides,
  createClassSlides,
  createQuickSlides
} from "./slideFactory";

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

    const { slides, selectedPhotos, selectedPhotosCount } = createQuickSlides(
      photos,
      durationSeconds
    );

    expect(selectedPhotosCount).toBe(SESSION_PHOTO_LIMIT);
    expect(selectedPhotos).toHaveLength(SESSION_PHOTO_LIMIT);
    expect(slides).toHaveLength(SESSION_PHOTO_LIMIT);
    expect(slides.map((slide) => slide.file)).toEqual(selectedPhotos);
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
        blockType: "pose",
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

  it("reports blocks that fall back to all photos when tags have no matches", () => {
    const sourcePhotos = [
      { name: "photo-a.jpg", size: 10, lastModified: 1 },
      { name: "photo-b.jpg", size: 20, lastModified: 2 }
    ];

    const { slides, fallbackTagBlocks } = createClassSlides({
      sourcePhotos,
      classBlocks: [{ label: "Targeted", durationSeconds: 30, poseCount: 2, photoTag: "hands" }],
      classPhotoOrder: "sequential",
      avoidImmediateRepeats: true,
      photoTagsById: {}
    });

    expect(slides).toHaveLength(2);
    expect(fallbackTagBlocks).toEqual([
      {
        label: "Targeted",
        photoTag: "hands"
      }
    ]);
  });

  it("creates timed break slides and keeps pose numbering for pose slides only", () => {
    const sourcePhotos = [
      { name: "pose-a.jpg", size: 10, lastModified: 1 },
      { name: "pose-b.jpg", size: 20, lastModified: 2 }
    ];

    const { slides, poseCount, breakCount } = createClassSlides({
      sourcePhotos,
      classBlocks: [
        { label: "Warm-up", durationSeconds: 30, poseCount: 2, blockType: "pose" },
        { label: "Water Break", durationSeconds: 180, poseCount: 1, blockType: "break" },
        { label: "Long Pose", durationSeconds: 300, poseCount: 1, blockType: "pose" }
      ],
      classPhotoOrder: "sequential",
      avoidImmediateRepeats: true,
      photoTagsById: {}
    });

    expect(poseCount).toBe(3);
    expect(breakCount).toBe(1);
    expect(slides).toHaveLength(4);
    expect(slides[0]).toMatchObject({ kind: "pose", poseNumber: 1, label: "Warm-up" });
    expect(slides[1]).toMatchObject({ kind: "pose", poseNumber: 2, label: "Warm-up" });
    expect(slides[2]).toMatchObject({
      kind: "break",
      breakNumber: 1,
      label: "Water Break",
      durationSeconds: 180
    });
    expect(slides[3]).toMatchObject({ kind: "pose", poseNumber: 3, label: "Long Pose" });
  });
});

describe("applyClassPoseFilesToSlides", () => {
  it("keeps durations bound to pose slots while replacing assigned photos", () => {
    const photoA = { name: "A.jpg", size: 10, lastModified: 1 };
    const photoB = { name: "B.jpg", size: 20, lastModified: 2 };
    const photoC = { name: "C.jpg", size: 30, lastModified: 3 };

    const slides = [
      { kind: "pose", file: photoA, durationSeconds: 30, durationMs: 30000, poseNumber: 1 },
      { kind: "pose", file: photoB, durationSeconds: 300, durationMs: 300000, poseNumber: 2 },
      { kind: "break", durationSeconds: 120, durationMs: 120000, breakNumber: 1 },
      { kind: "pose", file: photoC, durationSeconds: 60, durationMs: 60000, poseNumber: 3 }
    ];

    const reordered = applyClassPoseFilesToSlides(slides, [photoB, photoC, photoA]);

    expect(reordered).toHaveLength(4);
    expect(reordered[0]).toMatchObject({
      kind: "pose",
      file: photoB,
      durationSeconds: 30,
      durationMs: 30000,
      poseNumber: 1
    });
    expect(reordered[1]).toMatchObject({
      kind: "pose",
      file: photoC,
      durationSeconds: 300,
      durationMs: 300000,
      poseNumber: 2
    });
    expect(reordered[2]).toBe(slides[2]);
    expect(reordered[3]).toMatchObject({
      kind: "pose",
      file: photoA,
      durationSeconds: 60,
      durationMs: 60000,
      poseNumber: 3
    });
  });
});
