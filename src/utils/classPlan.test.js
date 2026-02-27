import { describe, expect, it } from "vitest";
import {
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
