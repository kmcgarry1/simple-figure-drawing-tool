import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadSessionPreferences,
  normalizeSessionPreferences,
  persistSessionPreferences
} from "./persistence";

function createMemoryStorage() {
  const storage = new Map();
  return {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    },
    clear() {
      storage.clear();
    }
  };
}

describe("normalizeSessionPreferences", () => {
  it("falls back to safe defaults for invalid values", () => {
    const result = normalizeSessionPreferences({
      sessionMode: "bad-value",
      durationSeconds: -999,
      classPresetId: "missing",
      classBlocks: [],
      classPhotoOrder: "invalid",
      avoidImmediateRepeats: 0
    });

    expect(result.sessionMode).toBe("class");
    expect(result.durationSeconds).toBe(5);
    expect(result.classPresetId).toBe("class-1h");
    expect(result.classPhotoOrder).toBe("shuffle");
    expect(result.avoidImmediateRepeats).toBe(true);
    expect(result.photoTagsById).toEqual({});
    expect(result.mirrorLiveView).toBe(false);
    expect(result.grayscaleLiveView).toBe(false);
    expect(result.hideLiveOverlay).toBe(false);
    expect(result.classBlocks.length).toBeGreaterThan(0);
  });
});

describe("session preference storage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      localStorage: createMemoryStorage()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips normalized preferences in localStorage", () => {
    persistSessionPreferences({
      sessionMode: "quick",
      durationSeconds: 90,
      classPresetId: "class-2h",
      classBlocks: [{ label: "Gestures", durationSeconds: 45, poseCount: 4 }],
      classPhotoOrder: "sequential",
      avoidImmediateRepeats: false,
      photoTagsById: {
        "pose-1.jpg|1|111": "hands",
        "pose-2.jpg|2|222": " torso "
      },
      mirrorLiveView: true,
      grayscaleLiveView: true,
      hideLiveOverlay: true
    });

    const loaded = loadSessionPreferences();
    expect(loaded).toMatchObject({
      sessionMode: "quick",
      durationSeconds: 90,
      classPresetId: "class-2h",
      classPhotoOrder: "sequential",
      avoidImmediateRepeats: false,
      photoTagsById: {
        "pose-1.jpg|1|111": "hands",
        "pose-2.jpg|2|222": "torso"
      },
      mirrorLiveView: true,
      grayscaleLiveView: true,
      hideLiveOverlay: true
    });
    expect(loaded.classBlocks).toEqual([
      {
        label: "Gestures",
        durationSeconds: 45,
        poseCount: 4,
        photoTag: "all"
      }
    ]);
  });
});
