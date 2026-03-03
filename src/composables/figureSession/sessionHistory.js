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
  const startedAt = String(rawEntry?.startedAt ?? "").trim() || new Date().toISOString();
  const endedAt = String(rawEntry?.endedAt ?? "").trim() || startedAt;
  const elapsedSecondsRaw = Number.parseInt(String(rawEntry?.elapsedSeconds), 10);
  const elapsedSeconds = Number.isNaN(elapsedSecondsRaw) ? 0 : Math.max(0, elapsedSecondsRaw);
  const plannedSlidesRaw = Number.parseInt(String(rawEntry?.plannedSlides), 10);
  const plannedSlides = Number.isNaN(plannedSlidesRaw) ? 0 : Math.max(0, plannedSlidesRaw);
  const completedSlidesRaw = Number.parseInt(String(rawEntry?.completedSlides), 10);
  const completedSlides = Number.isNaN(completedSlidesRaw)
    ? 0
    : Math.min(plannedSlides, Math.max(0, completedSlidesRaw));

  return {
    id,
    sessionMode,
    result: rawEntry?.result === "completed" ? "completed" : "ended",
    startedAt,
    endedAt,
    elapsedSeconds,
    plannedSlides,
    completedSlides,
    templateName: normalizeTemplateName(rawEntry?.templateName),
    appliedTags: normalizeAppliedTags(rawEntry?.appliedTags),
    rerunSettings: normalizeHistoryRerunSettings(rawEntry?.rerunSettings, {
      fallbackSessionMode: sessionMode
    })
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
