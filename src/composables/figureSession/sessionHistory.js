import { getClassPresetById } from "../../utils/classPlan";
import { SESSION_MODE_CLASS, SESSION_MODE_QUICK } from "./constants";
import { normalizeSessionPreferences } from "./persistence";

const STORAGE_KEY = "figureDrawing.history.v1";
const MAX_HISTORY_ENTRIES = 100;
const RERUN_SETTINGS_SCHEMA_VERSION = 1;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeTemplateName(rawTemplateName) {
  const normalizedTemplateName = String(rawTemplateName ?? "").trim();
  return normalizedTemplateName || "";
}

function normalizePresetId(rawPresetId) {
  return String(rawPresetId ?? "").trim();
}

function normalizePresetLabel(rawPresetLabel, fallbackPresetLabel = "") {
  const normalizedPresetLabel = String(rawPresetLabel ?? "").trim();
  if (normalizedPresetLabel) {
    return normalizedPresetLabel;
  }

  return String(fallbackPresetLabel || "").trim();
}

function normalizeAppliedTags(rawAppliedTags) {
  const dedupedTags = new Set();
  const normalizedTags = [];

  for (const rawTag of Array.from(rawAppliedTags || [])) {
    const normalizedTag = String(rawTag ?? "").trim();
    if (!normalizedTag || dedupedTags.has(normalizedTag)) {
      continue;
    }

    dedupedTags.add(normalizedTag);
    normalizedTags.push(normalizedTag);
    if (normalizedTags.length >= 20) {
      break;
    }
  }

  return normalizedTags;
}

function normalizeSessionMode(rawSessionMode, fallbackSessionMode = SESSION_MODE_CLASS) {
  if (rawSessionMode === SESSION_MODE_QUICK || rawSessionMode === SESSION_MODE_CLASS) {
    return rawSessionMode;
  }

  return fallbackSessionMode === SESSION_MODE_QUICK ? SESSION_MODE_QUICK : SESSION_MODE_CLASS;
}

function parseNonNegativeInteger(rawValue, fallbackValue = 0) {
  const parsedValue = Number.parseInt(String(rawValue), 10);
  if (Number.isNaN(parsedValue)) {
    return Math.max(0, Number.parseInt(String(fallbackValue), 10) || 0);
  }

  return Math.max(0, parsedValue);
}

function parseSignedInteger(rawValue, fallbackValue = 0) {
  const parsedValue = Number.parseInt(String(rawValue), 10);
  if (Number.isNaN(parsedValue)) {
    return Number.parseInt(String(fallbackValue), 10) || 0;
  }

  return parsedValue;
}

export function normalizeHistoryRerunSettings(rawRerunSettings, options = {}) {
  const fallbackSessionMode = normalizeSessionMode(options.fallbackSessionMode);
  const normalizedSessionMode = normalizeSessionMode(
    rawRerunSettings?.sessionMode,
    fallbackSessionMode
  );
  const normalizedPreferences = normalizeSessionPreferences({
    sessionMode: normalizedSessionMode,
    durationSeconds: rawRerunSettings?.durationSeconds,
    classPresetId: rawRerunSettings?.classPresetId,
    classBlocks: rawRerunSettings?.classBlocks,
    classPhotoOrder: rawRerunSettings?.classPhotoOrder,
    avoidImmediateRepeats: rawRerunSettings?.avoidImmediateRepeats
  });

  return {
    schemaVersion: RERUN_SETTINGS_SCHEMA_VERSION,
    sessionMode: normalizedPreferences.sessionMode,
    durationSeconds: normalizedPreferences.durationSeconds,
    classPresetId: normalizedPreferences.classPresetId,
    classBlocks: normalizedPreferences.classBlocks.map((block) => ({ ...block })),
    classPhotoOrder: normalizedPreferences.classPhotoOrder,
    avoidImmediateRepeats: normalizedPreferences.avoidImmediateRepeats
  };
}

function normalizeHistoryEntry(rawEntry, index) {
  const idCandidate = String(rawEntry?.id ?? "").trim();
  const id = idCandidate || `session-${index + 1}`;
  const sessionMode = normalizeSessionMode(rawEntry?.sessionMode);
  const rerunSettings = normalizeHistoryRerunSettings(rawEntry?.rerunSettings, {
    fallbackSessionMode: sessionMode
  });
  const startedAt = String(rawEntry?.startedAt ?? "").trim() || new Date().toISOString();
  const endedAt = String(rawEntry?.endedAt ?? "").trim() || startedAt;
  const elapsedSeconds = parseNonNegativeInteger(rawEntry?.elapsedSeconds, 0);
  const plannedSlides = parseNonNegativeInteger(rawEntry?.plannedSlides, 0);
  const completedSlides = Math.min(
    plannedSlides,
    parseNonNegativeInteger(rawEntry?.completedSlides, plannedSlides)
  );

  const plannedDurationSeconds = parseNonNegativeInteger(
    rawEntry?.plannedDurationSeconds,
    elapsedSeconds
  );
  const completedDurationSeconds = Math.min(
    plannedDurationSeconds,
    parseNonNegativeInteger(rawEntry?.completedDurationSeconds, elapsedSeconds)
  );
  const durationDeltaSeconds = parseSignedInteger(
    rawEntry?.durationDeltaSeconds,
    elapsedSeconds - plannedDurationSeconds
  );

  const plannedBreakCount = parseNonNegativeInteger(rawEntry?.plannedBreakCount, 0);
  const completedBreakCount = Math.min(
    plannedBreakCount,
    parseNonNegativeInteger(rawEntry?.completedBreakCount, 0)
  );
  const plannedBreakDurationSeconds = parseNonNegativeInteger(
    rawEntry?.plannedBreakDurationSeconds,
    0
  );
  const completedBreakDurationSeconds = Math.min(
    plannedBreakDurationSeconds,
    parseNonNegativeInteger(rawEntry?.completedBreakDurationSeconds, 0)
  );

  const classPreset = getClassPresetById(rerunSettings.classPresetId);
  const defaultPresetId =
    sessionMode === SESSION_MODE_QUICK ? "quick-session" : classPreset.id;
  const defaultPresetLabel =
    sessionMode === SESSION_MODE_QUICK ? "Quick Session" : classPreset.label;
  const presetId = normalizePresetId(rawEntry?.presetId) || defaultPresetId;
  const presetLabel = normalizePresetLabel(rawEntry?.presetLabel, defaultPresetLabel);

  return {
    id,
    sessionMode,
    result: rawEntry?.result === "completed" ? "completed" : "ended",
    startedAt,
    endedAt,
    elapsedSeconds,
    plannedSlides,
    completedSlides,
    plannedDurationSeconds,
    completedDurationSeconds,
    durationDeltaSeconds,
    plannedBreakCount,
    completedBreakCount,
    plannedBreakDurationSeconds,
    completedBreakDurationSeconds,
    templateName: normalizeTemplateName(rawEntry?.templateName),
    presetId,
    presetLabel,
    appliedTags: normalizeAppliedTags(rawEntry?.appliedTags),
    rerunSettings
  };
}

export function normalizeSessionHistory(rawHistory) {
  return Array.from(rawHistory || [])
    .map((entry, index) => normalizeHistoryEntry(entry, index))
    .slice(0, MAX_HISTORY_ENTRIES);
}

export function loadSessionHistory() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    return normalizeSessionHistory(JSON.parse(rawValue));
  } catch {
    return [];
  }
}

export function persistSessionHistory(history) {
  if (!canUseStorage()) {
    return;
  }

  try {
    const normalized = normalizeSessionHistory(history);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore write failures to avoid breaking live session flow.
  }
}

export function appendSessionHistory(history, entry) {
  const normalizedEntry = normalizeHistoryEntry(entry, 0);
  const normalizedHistory = normalizeSessionHistory(history);
  const nextHistory = [normalizedEntry, ...normalizedHistory];
  return normalizeSessionHistory(nextHistory);
}

export function clearSessionHistoryStore() {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore clear failures.
  }
}
