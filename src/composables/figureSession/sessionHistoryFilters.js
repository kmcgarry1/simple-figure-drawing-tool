const HISTORY_EXPORT_SCHEMA_VERSION = 1;
const FILTER_VALUE_ALL = "all";

const MODE_FILTER_OPTIONS = new Set([FILTER_VALUE_ALL, "class", "quick"]);
const OUTCOME_FILTER_OPTIONS = new Set([FILTER_VALUE_ALL, "completed", "ended"]);

function normalizeSelectableFilterValue(rawValue, allowedValues) {
  const normalizedValue = String(rawValue || "").trim().toLowerCase();
  if (allowedValues.has(normalizedValue)) {
    return normalizedValue;
  }

  return FILTER_VALUE_ALL;
}

function normalizeDateFilterValue(rawValue) {
  return String(rawValue || "").trim();
}

function parseDateFilterBoundary(rawValue, { endOfDay = false } = {}) {
  const normalizedValue = normalizeDateFilterValue(rawValue);
  const match = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const boundaryDate = endOfDay
    ? new Date(year, monthIndex, day, 23, 59, 59, 999)
    : new Date(year, monthIndex, day, 0, 0, 0, 0);

  if (
    boundaryDate.getFullYear() !== year ||
    boundaryDate.getMonth() !== monthIndex ||
    boundaryDate.getDate() !== day
  ) {
    return null;
  }

  return boundaryDate.getTime();
}

function parseEntryTimestamp(rawTimestamp) {
  const parsedTimestamp = Date.parse(String(rawTimestamp || ""));
  if (Number.isNaN(parsedTimestamp)) {
    return null;
  }

  return parsedTimestamp;
}

export function normalizeSessionHistoryFilters(rawFilters) {
  return {
    mode: normalizeSelectableFilterValue(rawFilters?.mode, MODE_FILTER_OPTIONS),
    outcome: normalizeSelectableFilterValue(rawFilters?.outcome, OUTCOME_FILTER_OPTIONS),
    dateFrom: normalizeDateFilterValue(rawFilters?.dateFrom),
    dateTo: normalizeDateFilterValue(rawFilters?.dateTo)
  };
}

export function filterSessionHistory(history, rawFilters) {
  const normalizedFilters = normalizeSessionHistoryFilters(rawFilters);
  const fromTimestamp = parseDateFilterBoundary(normalizedFilters.dateFrom);
  const toTimestamp = parseDateFilterBoundary(normalizedFilters.dateTo, { endOfDay: true });

  return Array.from(history || []).filter((entry) => {
    if (normalizedFilters.mode !== FILTER_VALUE_ALL && entry?.sessionMode !== normalizedFilters.mode) {
      return false;
    }

    if (normalizedFilters.outcome !== FILTER_VALUE_ALL && entry?.result !== normalizedFilters.outcome) {
      return false;
    }

    const entryTimestamp = parseEntryTimestamp(entry?.endedAt);
    if (fromTimestamp !== null && (entryTimestamp === null || entryTimestamp < fromTimestamp)) {
      return false;
    }

    if (toTimestamp !== null && (entryTimestamp === null || entryTimestamp > toTimestamp)) {
      return false;
    }

    return true;
  });
}

export function createSessionHistoryExportPayload(history, rawFilters) {
  const normalizedFilters = normalizeSessionHistoryFilters(rawFilters);
  const entries = Array.from(history || []).map((entry) => ({ ...entry }));

  return {
    app: "figure-drawing",
    schemaVersion: HISTORY_EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    filters: normalizedFilters,
    entryCount: entries.length,
    entries
  };
}
