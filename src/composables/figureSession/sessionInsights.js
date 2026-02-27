const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_WINDOW_DAYS = 7;
const DEFAULT_TOP_TEMPLATE_COUNT = 3;
const DEFAULT_TOP_TAG_COUNT = 5;

function parseTimestampToMs(rawTimestamp) {
  const timestampMs = Date.parse(String(rawTimestamp ?? ""));
  return Number.isNaN(timestampMs) ? null : timestampMs;
}

function toSafeNonNegativeNumber(rawValue) {
  const parsedNumber = Number(rawValue);
  if (!Number.isFinite(parsedNumber)) {
    return 0;
  }

  return Math.max(0, parsedNumber);
}

function incrementUsageCount(usageByLabel, rawLabel) {
  const label = String(rawLabel ?? "").trim();
  if (!label) {
    return;
  }

  usageByLabel.set(label, (usageByLabel.get(label) || 0) + 1);
}

function toSortedUsageList(usageByLabel, limit) {
  return Array.from(usageByLabel.entries())
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

export function buildSessionInsights(history, options = {}) {
  const nowMs = toSafeNonNegativeNumber(options.nowMs || Date.now());
  const windowDays = Math.max(1, Number.parseInt(String(options.windowDays), 10) || DEFAULT_WINDOW_DAYS);
  const topTemplateLimit =
    Math.max(1, Number.parseInt(String(options.topTemplateLimit), 10) || DEFAULT_TOP_TEMPLATE_COUNT);
  const topTagLimit = Math.max(1, Number.parseInt(String(options.topTagLimit), 10) || DEFAULT_TOP_TAG_COUNT);
  const windowStartMs = nowMs - windowDays * DAY_IN_MS;

  let sessionsInWindow = 0;
  let completedSessionsInWindow = 0;
  let totalElapsedSecondsInWindow = 0;
  let totalCompletedSlidesInWindow = 0;
  let totalPlannedSlidesInWindow = 0;

  const templateUsageByLabel = new Map();
  const tagUsageByLabel = new Map();

  for (const entry of Array.from(history || [])) {
    const endedAtMs = parseTimestampToMs(entry?.endedAt);
    if (endedAtMs !== null && endedAtMs >= windowStartMs && endedAtMs <= nowMs) {
      sessionsInWindow += 1;
      if (entry?.result === "completed") {
        completedSessionsInWindow += 1;
      }

      const elapsedSeconds = toSafeNonNegativeNumber(entry?.elapsedSeconds);
      const plannedSlides = toSafeNonNegativeNumber(entry?.plannedSlides);
      const completedSlides = Math.min(
        plannedSlides,
        toSafeNonNegativeNumber(entry?.completedSlides)
      );

      totalElapsedSecondsInWindow += elapsedSeconds;
      totalPlannedSlidesInWindow += plannedSlides;
      totalCompletedSlidesInWindow += completedSlides;
    }

    incrementUsageCount(templateUsageByLabel, entry?.templateName);

    const uniqueTags = new Set(
      Array.from(entry?.appliedTags || [])
        .map((rawTag) => String(rawTag ?? "").trim())
        .filter(Boolean)
    );
    for (const tag of uniqueTags) {
      incrementUsageCount(tagUsageByLabel, tag);
    }
  }

  const averageCompletedSlides =
    sessionsInWindow > 0 ? totalCompletedSlidesInWindow / sessionsInWindow : 0;
  const averageCompletionRatioPercent =
    totalPlannedSlidesInWindow > 0
      ? Math.round((totalCompletedSlidesInWindow / totalPlannedSlidesInWindow) * 100)
      : 0;

  return {
    windowDays,
    sessionsInWindow,
    completedSessionsInWindow,
    totalElapsedSecondsInWindow,
    totalCompletedSlidesInWindow,
    averageCompletedSlides,
    averageCompletionRatioPercent,
    topTemplates: toSortedUsageList(templateUsageByLabel, topTemplateLimit),
    topTags: toSortedUsageList(tagUsageByLabel, topTagLimit)
  };
}
