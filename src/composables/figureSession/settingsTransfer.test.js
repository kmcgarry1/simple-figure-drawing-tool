import { describe, expect, it } from "vitest";
import {
  buildSettingsShareStorageConfig,
  buildSettingsShareUrl,
  createSettingsExportPayload,
  createSettingsShareToken,
  DEFAULT_SETTINGS_SHARE_EXPIRY_SECONDS,
  normalizeSettingsShareExpirySeconds,
  parseSettingsImportText,
  parseSettingsShareToken,
  readSettingsShareReferenceFromSearch,
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

  it("supports share references in urls", () => {
    const shareUrl = buildSettingsShareUrl({
      currentUrl: "https://example.com/app?remote=1",
      shareReference: "share-123"
    });

    expect(shareUrl).toBe("https://example.com/app?remote=1&shareRef=share-123");
    expect(readSettingsShareReferenceFromSearch("?remote=1&shareRef=share-123")).toBe(
      "share-123"
    );
    expect(readSettingsShareTokenFromSearch("?remote=1&shareRef=share-123")).toBe("");
  });

  it("uses share reference when both token and reference are provided", () => {
    const shareUrl = buildSettingsShareUrl({
      currentUrl: "https://example.com/app?remote=1",
      shareToken: "abc123",
      shareReference: "share-123"
    });

    expect(shareUrl).toBe("https://example.com/app?remote=1&shareRef=share-123");
  });

  it("marks share tokens as expired after configured ttl", () => {
    const nowMs = Date.parse("2026-03-04T10:00:00.000Z");
    const shareToken = createSettingsShareToken(
      {
        sessionMode: "quick",
        durationSeconds: 90,
        classPresetId: "class-2h",
        classBlocks: [{ label: "Gestures", durationSeconds: 45, poseCount: 4 }],
        classPhotoOrder: "sequential",
        avoidImmediateRepeats: false,
        photoTagsById: {},
        audioMuted: false,
        audioVolumePercent: 60
      },
      {
        nowMs,
        expiresInSeconds: 60
      }
    );

    expect(() =>
      parseSettingsShareToken(shareToken, {
        nowMs: nowMs + 61_000
      })
    ).toThrowError("Share link has expired.");
  });
});

describe("settings share config helpers", () => {
  it("normalizes share expiry seconds", () => {
    expect(normalizeSettingsShareExpirySeconds("3600")).toBe(3600);
    expect(normalizeSettingsShareExpirySeconds("invalid")).toBe(
      DEFAULT_SETTINGS_SHARE_EXPIRY_SECONDS
    );
  });

  it("builds optional storage config from env", () => {
    expect(
      buildSettingsShareStorageConfig({
        env: {}
      })
    ).toEqual({
      enabled: false,
      endpoint: "",
      requestTimeoutMs: 5000
    });

    expect(
      buildSettingsShareStorageConfig({
        env: {
          VITE_SETTINGS_SHARE_ENDPOINT: "https://share.example.com",
          VITE_SETTINGS_SHARE_TIMEOUT_MS: "7000"
        }
      })
    ).toEqual({
      enabled: true,
      endpoint: "https://share.example.com",
      requestTimeoutMs: 7000
    });
  });
});
