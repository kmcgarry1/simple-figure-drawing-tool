import {
  appendSessionHistory,
  clearSessionHistoryStore,
  normalizeHistoryRerunSettings,
  persistSessionHistory
} from "./sessionHistory";

export function createSessionHistoryActions({
  sessionHistory,
  sessionMode,
  sessionSlides,
  statusMessage,
  runStartedAtMs,
  runPlannedSlides,
  getSessionHistoryContext
}) {
  function normalizeHistoryAttributionLabel(rawLabel, fallbackLabel = "") {
    const normalizedLabel = String(rawLabel ?? "").trim();
    return normalizedLabel || String(fallbackLabel || "").trim();
  }

  function normalizeHistoryAttributionId(rawId) {
    return String(rawId ?? "").trim();
  }

  function toSafeSlideDurationSeconds(slide) {
    const durationSeconds =
      Number.parseInt(String(slide?.durationSeconds), 10) ||
      Math.max(0, Math.round((slide?.durationMs || 0) / 1000));
    return Math.max(0, durationSeconds);
  }

  function summarizeSlides(slides) {
    return Array.from(slides || []).reduce(
      (summary, slide) => {
        const durationSeconds = toSafeSlideDurationSeconds(slide);
        summary.totalDurationSeconds += durationSeconds;

        if (slide?.kind === "break") {
          summary.breakCount += 1;
          summary.breakDurationSeconds += durationSeconds;
          return summary;
        }

        summary.poseCount += 1;
        summary.poseDurationSeconds += durationSeconds;
        return summary;
      },
      {
        totalDurationSeconds: 0,
        poseCount: 0,
        poseDurationSeconds: 0,
        breakCount: 0,
        breakDurationSeconds: 0
      }
    );
  }

  let runContext = {
    templateName: "",
    appliedTags: [],
    presetId: "",
    presetLabel: "",
    rerunSettings: normalizeHistoryRerunSettings(null, {
      fallbackSessionMode: sessionMode.value
    })
  };

  function normalizeSessionHistoryContext(rawContext) {
    const templateName = String(rawContext?.templateName ?? "").trim();
    const appliedTags = [];
    const dedupedTags = new Set();

    for (const rawTag of Array.from(rawContext?.appliedTags || [])) {
      const normalizedTag = String(rawTag ?? "").trim();
      if (!normalizedTag || dedupedTags.has(normalizedTag)) {
        continue;
      }

      dedupedTags.add(normalizedTag);
      appliedTags.push(normalizedTag);
      if (appliedTags.length >= 20) {
        break;
      }
    }

    return {
      templateName,
      appliedTags,
      presetId: normalizeHistoryAttributionId(rawContext?.presetId),
      presetLabel: normalizeHistoryAttributionLabel(rawContext?.presetLabel),
      rerunSettings: normalizeHistoryRerunSettings(rawContext?.rerunSettings, {
        fallbackSessionMode: sessionMode.value
      })
    };
  }

  function markRunStarted(context) {
    runStartedAtMs.value = Date.now();
    runPlannedSlides.value = sessionSlides.value.length;
    const resolvedContext =
      context && typeof context === "object"
        ? context
        : getSessionHistoryContext?.() || {};
    runContext = normalizeSessionHistoryContext(resolvedContext);
  }

  function resetRunTracking() {
    runStartedAtMs.value = null;
    runPlannedSlides.value = 0;
    runContext = {
      templateName: "",
      appliedTags: [],
      presetId: "",
      presetLabel: "",
      rerunSettings: normalizeHistoryRerunSettings(null, {
        fallbackSessionMode: sessionMode.value
      })
    };
  }

  function recordSessionHistory(result, completedSlides) {
    if (!runStartedAtMs.value) {
      return;
    }

    const now = Date.now();
    const plannedSlides = runPlannedSlides.value || sessionSlides.value.length;
    const plannedSlideSet = sessionSlides.value.slice(0, plannedSlides);
    const normalizedCompletedSlides = Math.min(
      plannedSlides,
      Math.max(0, Number.parseInt(String(completedSlides), 10) || 0)
    );
    const elapsedSeconds = Math.max(0, Math.round((now - runStartedAtMs.value) / 1000));
    const completedSlideSet = plannedSlideSet.slice(0, normalizedCompletedSlides);
    const plannedSummary = summarizeSlides(plannedSlideSet);
    const completedSummary = summarizeSlides(completedSlideSet);

    sessionHistory.value = appendSessionHistory(sessionHistory.value, {
      id: `session-${now}-${Math.floor(Math.random() * 10000)}`,
      sessionMode: sessionMode.value,
      result,
      startedAt: new Date(runStartedAtMs.value).toISOString(),
      endedAt: new Date(now).toISOString(),
      elapsedSeconds,
      plannedSlides,
      completedSlides: normalizedCompletedSlides,
      plannedDurationSeconds: plannedSummary.totalDurationSeconds,
      completedDurationSeconds: completedSummary.totalDurationSeconds,
      durationDeltaSeconds: elapsedSeconds - plannedSummary.totalDurationSeconds,
      plannedBreakCount: plannedSummary.breakCount,
      completedBreakCount: completedSummary.breakCount,
      plannedBreakDurationSeconds: plannedSummary.breakDurationSeconds,
      completedBreakDurationSeconds: completedSummary.breakDurationSeconds,
      templateName: runContext.templateName,
      presetId: runContext.presetId,
      presetLabel: runContext.presetLabel,
      appliedTags: runContext.appliedTags,
      rerunSettings: runContext.rerunSettings
    });
    persistSessionHistory(sessionHistory.value);
    resetRunTracking();
  }

  function clearSessionHistory() {
    sessionHistory.value = [];
    clearSessionHistoryStore();
    statusMessage.value = "Session history cleared.";
    resetRunTracking();
  }

  return {
    markRunStarted,
    recordSessionHistory,
    clearSessionHistory,
    resetRunTracking
  };
}
