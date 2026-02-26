import { DEFAULT_DURATION_SECONDS } from "../../config";
import { clampDurationSeconds } from "../../utils/photoInput";
import {
  createBlocksFromPreset,
  getClassPresetById,
  sanitizeClassBlocks
} from "../../utils/classPlan";
import {
  PHOTO_ORDER_SEQUENTIAL,
  PHOTO_ORDER_SHUFFLE,
  SESSION_MODE_CLASS,
  SESSION_MODE_QUICK
} from "./constants";

const STORAGE_KEY = "figureDrawing.preferences.v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeSessionMode(value) {
  return [SESSION_MODE_CLASS, SESSION_MODE_QUICK].includes(value)
    ? value
    : SESSION_MODE_CLASS;
}

function normalizePhotoOrder(value) {
  return [PHOTO_ORDER_SHUFFLE, PHOTO_ORDER_SEQUENTIAL].includes(value)
    ? value
    : PHOTO_ORDER_SHUFFLE;
}

function resolvePresetId(rawPresetId) {
  return getClassPresetById(rawPresetId).id;
}

function resolveClassBlocks(rawBlocks, fallbackPresetId) {
  if (!Array.isArray(rawBlocks) || rawBlocks.length === 0) {
    return createBlocksFromPreset(fallbackPresetId);
  }

  return sanitizeClassBlocks(rawBlocks);
}

function normalizeBoolean(rawValue, fallback) {
  return typeof rawValue === "boolean" ? rawValue : fallback;
}

function defaultPreferences() {
  const defaultPresetId = resolvePresetId();
  return {
    sessionMode: SESSION_MODE_CLASS,
    durationSeconds: clampDurationSeconds(DEFAULT_DURATION_SECONDS),
    classPresetId: defaultPresetId,
    classBlocks: createBlocksFromPreset(defaultPresetId),
    classPhotoOrder: PHOTO_ORDER_SHUFFLE,
    avoidImmediateRepeats: true,
    mirrorLiveView: false,
    grayscaleLiveView: false,
    hideLiveOverlay: false
  };
}

export function normalizeSessionPreferences(rawPreferences) {
  const defaults = defaultPreferences();
  const classPresetId = resolvePresetId(rawPreferences?.classPresetId);

  return {
    sessionMode: normalizeSessionMode(rawPreferences?.sessionMode),
    durationSeconds: clampDurationSeconds(rawPreferences?.durationSeconds),
    classPresetId,
    classBlocks: resolveClassBlocks(rawPreferences?.classBlocks, classPresetId),
    classPhotoOrder: normalizePhotoOrder(rawPreferences?.classPhotoOrder),
    avoidImmediateRepeats: normalizeBoolean(
      rawPreferences?.avoidImmediateRepeats,
      defaults.avoidImmediateRepeats
    ),
    mirrorLiveView: normalizeBoolean(rawPreferences?.mirrorLiveView, defaults.mirrorLiveView),
    grayscaleLiveView: normalizeBoolean(
      rawPreferences?.grayscaleLiveView,
      defaults.grayscaleLiveView
    ),
    hideLiveOverlay: normalizeBoolean(rawPreferences?.hideLiveOverlay, defaults.hideLiveOverlay)
  };
}

export function loadSessionPreferences() {
  if (!canUseStorage()) {
    return defaultPreferences();
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return defaultPreferences();
    }

    return normalizeSessionPreferences(JSON.parse(rawValue));
  } catch {
    return defaultPreferences();
  }
}

export function persistSessionPreferences(preferences) {
  if (!canUseStorage()) {
    return;
  }

  try {
    const normalized = normalizeSessionPreferences(preferences);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore storage write failures to avoid interrupting session flow.
  }
}
