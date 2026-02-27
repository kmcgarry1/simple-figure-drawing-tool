import { describe, expect, it } from "vitest";
import {
  createSettingsExportPayload,
  parseSettingsImportText
} from "./settingsTransfer";

describe("createSettingsExportPayload", () => {
  it("wraps normalized preferences in a versioned export payload", () => {
    const payload = createSettingsExportPayload({
      sessionMode: "quick",
      durationSeconds: 75,
      classPresetId: "class-2h",
      classBlocks: [{ label: "Gestures", durationSeconds: 45, poseCount: 4 }],
      classPhotoOrder: "shuffle",
      avoidImmediateRepeats: false,
      photoTagsById: {
        "pose-1.jpg|1|111": "hands"
      }
    });

    expect(payload).toMatchObject({
      app: "figure-drawing",
      schemaVersion: 1
    });
    expect(payload.preferences).toMatchObject({
      sessionMode: "quick",
      durationSeconds: 75,
      classPresetId: "class-2h",
      photoTagsById: {
        "pose-1.jpg|1|111": "hands"
      }
    });
  });
});

describe("parseSettingsImportText", () => {
  it("supports payload wrappers and sanitizes invalid values", () => {
    const imported = parseSettingsImportText(
      JSON.stringify({
        preferences: {
          sessionMode: "invalid",
          durationSeconds: -20,
          classPresetId: "bad-id",
          classBlocks: [],
          classPhotoOrder: "weird",
          avoidImmediateRepeats: "yes",
          photoTagsById: ["bad-value"]
        }
      })
    );

    expect(imported).toMatchObject({
      sessionMode: "class",
      durationSeconds: 5,
      classPresetId: "class-1h",
      classPhotoOrder: "shuffle",
      avoidImmediateRepeats: true,
      photoTagsById: {}
    });
  });
});
