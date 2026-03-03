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
  let runContext = {
    templateName: "",
    appliedTags: [],
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
    const normalizedCompletedSlides = Math.min(
      plannedSlides,
      Math.max(0, Number.parseInt(String(completedSlides), 10) || 0)
    );

    sessionHistory.value = appendSessionHistory(sessionHistory.value, {
      id: `session-${now}-${Math.floor(Math.random() * 10000)}`,
      sessionMode: sessionMode.value,
      result,
      startedAt: new Date(runStartedAtMs.value).toISOString(),
      endedAt: new Date(now).toISOString(),
      elapsedSeconds: Math.max(0, Math.round((now - runStartedAtMs.value) / 1000)),
      plannedSlides,
      completedSlides: normalizedCompletedSlides,
      templateName: runContext.templateName,
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
