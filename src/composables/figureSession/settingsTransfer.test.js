import { describe, expect, it } from "vitest";
import {
  buildSettingsShareUrl,
  createSettingsExportPayload,
  createSettingsShareToken,
  parseSettingsImportText,
  parseSettingsShareToken,
  readSettingsShareTokenFromSearch
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
      audioMuted: true,
      audioVolumePercent: 73,
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
      audioMuted: true,
      audioVolumePercent: 73,
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
          photoTagsById: ["bad-value"],
          audioMuted: "no",
          audioVolumePercent: -10
        }
      })
    );

    expect(imported).toMatchObject({
      sessionMode: "class",
      durationSeconds: 5,
      classPresetId: "class-1h",
      classPhotoOrder: "shuffle",
      avoidImmediateRepeats: true,
      photoTagsById: {},
      audioMuted: false,
      audioVolumePercent: 0
    });
  });
});

describe("settings share links", () => {
  it("round-trips settings through share token encode/decode", () => {
    const shareToken = createSettingsShareToken({
      sessionMode: "quick",
      durationSeconds: 90,
      classPresetId: "class-2h",
      classBlocks: [{ label: "Gestures", durationSeconds: 45, poseCount: 4 }],
      classPhotoOrder: "sequential",
      avoidImmediateRepeats: false,
      photoTagsById: {
        "pose-1.jpg|1|111": "hands"
      },
      audioMuted: true,
      audioVolumePercent: 80
    });

    const parsed = parseSettingsShareToken(shareToken);
    expect(parsed).toMatchObject({
      sessionMode: "quick",
      durationSeconds: 90,
      classPresetId: "class-2h",
      classPhotoOrder: "sequential",
      avoidImmediateRepeats: false,
      audioMuted: true,
      audioVolumePercent: 80,
      photoTagsById: {
        "pose-1.jpg|1|111": "hands"
      }
    });
  });

  it("builds share url and reads share token from search params", () => {
    const shareUrl = buildSettingsShareUrl({
      currentUrl: "https://example.com/app?remote=1",
      shareToken: "abc123"
    });

    expect(shareUrl).toBe("https://example.com/app?remote=1&share=abc123");
    expect(readSettingsShareTokenFromSearch("?remote=1&share=abc123")).toBe("abc123");
  });
});
