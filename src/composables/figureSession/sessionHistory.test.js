import { describe, expect, it } from "vitest";
import {
  appendSessionHistory,
  normalizeHistoryRerunSettings,
  normalizeSessionHistory
} from "./sessionHistory";

describe("normalizeSessionHistory", () => {
  it("normalizes malformed entries", () => {
    const history = normalizeSessionHistory([
      {
        sessionMode: "invalid",
        result: "weird",
        elapsedSeconds: "bad",
        plannedSlides: 5,
        completedSlides: 99,
        templateName: "  Gesture Warmups  ",
        appliedTags: ["hands", "hands", " torso "]
      }
    ]);

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      sessionMode: "class",
      result: "ended",
      elapsedSeconds: 0,
      plannedSlides: 5,
      completedSlides: 5,
      templateName: "Gesture Warmups",
      appliedTags: ["hands", "torso"],
      rerunSettings: {
        sessionMode: "class",
        durationSeconds: 60,
        classPresetId: "class-1h",
        classPhotoOrder: "shuffle",
        avoidImmediateRepeats: true
      }
    });
  });
});

describe("normalizeHistoryRerunSettings", () => {
  it("sanitizes malformed rerun settings with a provided mode fallback", () => {
    const settings = normalizeHistoryRerunSettings(
      {
        sessionMode: "invalid",
        durationSeconds: -10,
        classPresetId: "not-real",
        classBlocks: [],
        classPhotoOrder: "weird",
        avoidImmediateRepeats: "bad"
      },
      {
        fallbackSessionMode: "quick"
      }
    );

    expect(settings).toMatchObject({
      schemaVersion: 1,
      sessionMode: "quick",
      durationSeconds: 5,
      classPresetId: "class-1h",
      classPhotoOrder: "shuffle",
      avoidImmediateRepeats: true
    });
  });
});

describe("appendSessionHistory", () => {
  it("adds newest entries at the top", () => {
    const first = appendSessionHistory([], {
      id: "one",
      sessionMode: "quick",
      result: "completed",
      startedAt: "2024-01-01T00:00:00.000Z",
      endedAt: "2024-01-01T00:10:00.000Z",
      elapsedSeconds: 600,
      plannedSlides: 10,
      completedSlides: 10
    });

    const second = appendSessionHistory(first, {
      id: "two",
      sessionMode: "class",
      result: "ended",
      startedAt: "2024-01-02T00:00:00.000Z",
      endedAt: "2024-01-02T00:05:00.000Z",
      elapsedSeconds: 300,
      plannedSlides: 20,
      completedSlides: 7
    });

    expect(second[0].id).toBe("two");
    expect(second[1].id).toBe("one");
    expect(second[0].rerunSettings).toMatchObject({
      schemaVersion: 1,
      sessionMode: "class"
    });
  });
});
