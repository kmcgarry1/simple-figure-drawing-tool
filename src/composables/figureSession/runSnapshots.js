import { SESSION_MODE_CLASS, SESSION_MODE_QUICK } from "./constants";
import { normalizeHistoryRerunSettings } from "./sessionHistory";

const STORAGE_KEY = "figureDrawing.runSnapshots.v1";
const MAX_SNAPSHOT_COUNT = 100;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function createSnapshotId() {
  return `snapshot-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function normalizeSnapshotName(rawName, fallbackName) {
  const normalizedName = String(rawName ?? "").trim();
  return normalizedName || fallbackName;
}

function normalizeSessionMode(rawSessionMode, fallbackSessionMode = SESSION_MODE_CLASS) {
  if (rawSessionMode === SESSION_MODE_QUICK || rawSessionMode === SESSION_MODE_CLASS) {
    return rawSessionMode;
  }

  return fallbackSessionMode === SESSION_MODE_QUICK ? SESSION_MODE_QUICK : SESSION_MODE_CLASS;
}

function normalizeTemplateName(rawTemplateName) {
  return String(rawTemplateName ?? "").trim();
}

function normalizeSourceSessionId(rawSourceSessionId) {
  return String(rawSourceSessionId ?? "").trim();
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

function normalizeRunSnapshot(rawSnapshot, index) {
  const fallbackSessionMode = normalizeSessionMode(rawSnapshot?.sessionMode);
  const rerunSettings = normalizeHistoryRerunSettings(rawSnapshot?.rerunSettings, {
    fallbackSessionMode
  });

  const idCandidate = String(rawSnapshot?.id ?? "").trim();
  const id = idCandidate || `snapshot-${index + 1}`;
  const createdAtCandidate = String(rawSnapshot?.createdAt ?? "").trim();
  const updatedAtCandidate = String(rawSnapshot?.updatedAt ?? "").trim();
  const createdAt = createdAtCandidate || new Date().toISOString();
  const updatedAt = updatedAtCandidate || createdAt;

  return {
    id,
    name: normalizeSnapshotName(rawSnapshot?.name, `Snapshot ${index + 1}`),
    sessionMode: rerunSettings.sessionMode,
    sourceSessionId: normalizeSourceSessionId(rawSnapshot?.sourceSessionId),
    templateName: normalizeTemplateName(rawSnapshot?.templateName),
    appliedTags: normalizeAppliedTags(rawSnapshot?.appliedTags),
    rerunSettings,
    createdAt,
    updatedAt
  };
}

export function normalizeRunSnapshots(rawSnapshots) {
  const dedupedIds = new Set();
  const normalized = [];

  for (const [index, rawSnapshot] of Array.from(rawSnapshots || []).entries()) {
    const snapshot = normalizeRunSnapshot(rawSnapshot, index);
    if (dedupedIds.has(snapshot.id)) {
      continue;
    }

    dedupedIds.add(snapshot.id);
    normalized.push(snapshot);
    if (normalized.length >= MAX_SNAPSHOT_COUNT) {
      break;
    }
  }

  return normalized;
}

export function loadRunSnapshots() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    return normalizeRunSnapshots(JSON.parse(rawValue));
  } catch {
    return [];
  }
}

export function persistRunSnapshots(snapshots) {
  if (!canUseStorage()) {
    return;
  }

  try {
    const normalizedSnapshots = normalizeRunSnapshots(snapshots);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedSnapshots));
  } catch {
    // Ignore write failures to avoid interrupting setup flow.
  }
}

function findSnapshotIndexByName(snapshots, snapshotName) {
  const normalizedSnapshotName = snapshotName.toLowerCase();
  return snapshots.findIndex((snapshot) => snapshot.name.toLowerCase() === normalizedSnapshotName);
}

export function saveRunSnapshot(snapshots, payload = {}) {
  const trimmedName = String(payload.name ?? "").trim();
  if (!trimmedName) {
    return {
      saved: false,
      reason: "missing-name",
      snapshots: normalizeRunSnapshots(snapshots)
    };
  }

  const normalizedSnapshots = normalizeRunSnapshots(snapshots);
  const fallbackSessionMode = normalizeSessionMode(payload.sessionMode);
  const rerunSettings = normalizeHistoryRerunSettings(payload.rerunSettings, {
    fallbackSessionMode
  });
  const now = new Date().toISOString();
  const snapshotIndex = findSnapshotIndexByName(normalizedSnapshots, trimmedName);

  if (snapshotIndex >= 0) {
    const existingSnapshot = normalizedSnapshots[snapshotIndex];
    const updatedSnapshot = {
      ...existingSnapshot,
      name: trimmedName,
      sessionMode: rerunSettings.sessionMode,
      sourceSessionId: normalizeSourceSessionId(payload.sourceSessionId),
      templateName: normalizeTemplateName(payload.templateName),
      appliedTags: normalizeAppliedTags(payload.appliedTags),
      rerunSettings,
      updatedAt: now
    };

    const nextSnapshots = normalizedSnapshots.map((snapshot, index) =>
      index === snapshotIndex ? updatedSnapshot : snapshot
    );

    return {
      saved: true,
      updated: true,
      snapshot: updatedSnapshot,
      snapshots: normalizeRunSnapshots(nextSnapshots)
    };
  }

  const newSnapshot = {
    id: createSnapshotId(),
    name: trimmedName,
    sessionMode: rerunSettings.sessionMode,
    sourceSessionId: normalizeSourceSessionId(payload.sourceSessionId),
    templateName: normalizeTemplateName(payload.templateName),
    appliedTags: normalizeAppliedTags(payload.appliedTags),
    rerunSettings,
    createdAt: now,
    updatedAt: now
  };

  return {
    saved: true,
    updated: false,
    snapshot: newSnapshot,
    snapshots: normalizeRunSnapshots([newSnapshot, ...normalizedSnapshots])
  };
}

export function getRunSnapshotById(snapshots, snapshotId) {
  const normalizedSnapshotId = String(snapshotId ?? "").trim();
  if (!normalizedSnapshotId) {
    return null;
  }

  return (
    normalizeRunSnapshots(snapshots).find((snapshot) => snapshot.id === normalizedSnapshotId) || null
  );
}

export function removeRunSnapshotById(snapshots, snapshotId) {
  const normalizedSnapshotId = String(snapshotId ?? "").trim();
  if (!normalizedSnapshotId) {
    return normalizeRunSnapshots(snapshots);
  }

  return normalizeRunSnapshots(snapshots).filter((snapshot) => snapshot.id !== normalizedSnapshotId);
}
