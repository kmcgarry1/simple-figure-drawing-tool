import { describe, expect, it } from "vitest";
import {
  getRunSnapshotById,
  normalizeRunSnapshots,
  removeRunSnapshotById,
  saveRunSnapshot
} from "./runSnapshots";

describe("normalizeRunSnapshots", () => {
  it("sanitizes malformed snapshots and rerun settings", () => {
    const snapshots = normalizeRunSnapshots([
      {
        id: "",
        name: "  ",
        sessionMode: "invalid",
        sourceSessionId: "  run-1  ",
        templateName: "  Gesture Warmups  ",
        appliedTags: ["hands", "hands", " torso "],
        rerunSettings: {
          sessionMode: "quick",
          durationSeconds: "bad",
          classPresetId: "bad-preset",
          classBlocks: [],
          classPhotoOrder: "invalid",
          avoidImmediateRepeats: "invalid"
        }
      }
    ]);

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toMatchObject({
      id: "snapshot-1",
      name: "Snapshot 1",
      sessionMode: "quick",
      sourceSessionId: "run-1",
      templateName: "Gesture Warmups",
      appliedTags: ["hands", "torso"],
      rerunSettings: {
        sessionMode: "quick",
        durationSeconds: 60,
        classPresetId: "class-1h",
        classPhotoOrder: "shuffle",
        avoidImmediateRepeats: true
      }
    });
  });
});

describe("saveRunSnapshot", () => {
  it("creates snapshots and updates by case-insensitive name", () => {
    const firstSave = saveRunSnapshot([], {
      name: "Quick 90",
      sessionMode: "quick",
      sourceSessionId: "run-quick-1",
      rerunSettings: {
        sessionMode: "quick",
        durationSeconds: 90
      }
    });

    expect(firstSave.saved).toBe(true);
    expect(firstSave.updated).toBe(false);
    expect(firstSave.snapshot.name).toBe("Quick 90");

    const secondSave = saveRunSnapshot(firstSave.snapshots, {
      name: " quick 90 ",
      sessionMode: "quick",
      sourceSessionId: "run-quick-2",
      rerunSettings: {
        sessionMode: "quick",
        durationSeconds: 120
      }
    });

    expect(secondSave.saved).toBe(true);
    expect(secondSave.updated).toBe(true);
    expect(secondSave.snapshots).toHaveLength(1);
    expect(secondSave.snapshot.sourceSessionId).toBe("run-quick-2");
    expect(secondSave.snapshot.rerunSettings.durationSeconds).toBe(120);
  });

  it("requires a snapshot name", () => {
    const result = saveRunSnapshot([], {
      name: "  ",
      sessionMode: "class",
      rerunSettings: {
        sessionMode: "class"
      }
    });

    expect(result.saved).toBe(false);
    expect(result.reason).toBe("missing-name");
    expect(result.snapshots).toHaveLength(0);
  });
});

describe("snapshot selectors", () => {
  it("gets and removes snapshots by id", () => {
    const saveResult = saveRunSnapshot([], {
      name: "Class Snapshot",
      sessionMode: "class",
      sourceSessionId: "run-class-1",
      rerunSettings: {
        sessionMode: "class"
      }
    });

    const snapshot = saveResult.snapshot;
    expect(getRunSnapshotById(saveResult.snapshots, snapshot.id)).toMatchObject({
      id: snapshot.id,
      name: "Class Snapshot"
    });

    const remainingSnapshots = removeRunSnapshotById(saveResult.snapshots, snapshot.id);
    expect(remainingSnapshots).toHaveLength(0);
    expect(getRunSnapshotById(remainingSnapshots, snapshot.id)).toBeNull();
  });
});
