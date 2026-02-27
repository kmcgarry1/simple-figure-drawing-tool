import { describe, expect, it } from "vitest";
import {
  buildGuidedClassBlocks,
  calculateClassPlanSummary,
  expandClassBlocks,
  sanitizeClassBlocks
} from "./classPlan";

describe("sanitizeClassBlocks", () => {
  it("normalizes bad values and keeps one safe block", () => {
    const result = sanitizeClassBlocks([
      {
        label: "",
        durationSeconds: "invalid",
        poseCount: 0
      }
    ]);

    expect(result).toEqual([
      {
        blockType: "pose",
        label: "Custom Block",
        durationSeconds: 120,
        poseCount: 1,
        photoTag: "all"
      }
    ]);
  });
});

describe("calculateClassPlanSummary", () => {
  it("returns total poses and total seconds", () => {
    const summary = calculateClassPlanSummary([
      { label: "Gesture", durationSeconds: 30, poseCount: 4, blockType: "pose" },
      { label: "Break", durationSeconds: 300, poseCount: 1, blockType: "break" },
      { label: "Long Pose", durationSeconds: 300, poseCount: 2, blockType: "pose" }
    ]);

    expect(summary).toEqual({
      totalPoses: 6,
      totalBreaks: 1,
      totalSeconds: 1020
    });
  });
});

describe("expandClassBlocks", () => {
  it("expands blocks into per-pose entries", () => {
    const poses = expandClassBlocks([
      { label: "Warm-up", durationSeconds: 60, poseCount: 2 },
      { label: "Long Pose", durationSeconds: 300, poseCount: 1 }
    ]);

    expect(poses).toEqual([
      { label: "Warm-up", durationSeconds: 60, blockType: "pose" },
      { label: "Warm-up", durationSeconds: 60, blockType: "pose" },
      { label: "Long Pose", durationSeconds: 300, blockType: "pose" }
    ]);
  });
});

describe("buildGuidedClassBlocks", () => {
  it("creates a guided class plan with tag-aware gesture and long-pose blocks", () => {
    const blocks = buildGuidedClassBlocks({
      targetMinutes: 120,
      gestureSharePercent: 70,
      gestureTag: "hands",
      longPoseTag: "full-body",
      includeBreaks: true
    });

    expect(blocks.length).toBeGreaterThanOrEqual(4);
    expect(blocks[0]).toMatchObject({
      blockType: "pose",
      label: "Warm-up",
      photoTag: "hands"
    });
    expect(blocks.some((block) => block.blockType === "break")).toBe(true);
    expect(
      blocks.some(
        (block) => block.blockType === "pose" && block.photoTag === "full-body"
      )
    ).toBe(true);
  });

  it("falls back to safe defaults when options are invalid", () => {
    const blocks = buildGuidedClassBlocks({
      targetMinutes: -20,
      gestureSharePercent: 999,
      gestureTag: "",
      longPoseTag: "",
      includeBreaks: false
    });

    const summary = calculateClassPlanSummary(blocks);
    expect(summary.totalPoses).toBeGreaterThan(0);
    expect(summary.totalBreaks).toBe(0);
    expect(blocks.every((block) => block.durationSeconds >= 5)).toBe(true);
    expect(blocks.every((block) => block.poseCount >= 1)).toBe(true);
  });
});
