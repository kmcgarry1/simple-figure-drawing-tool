import {
  appendSessionHistory,
  clearSessionHistoryStore,
  persistSessionHistory
} from "./sessionHistory";

export function createSessionHistoryActions({
  sessionHistory,
  sessionMode,
  sessionSlides,
  statusMessage,
  runStartedAtMs,
  runPlannedSlides
}) {
  function markRunStarted() {
    runStartedAtMs.value = Date.now();
    runPlannedSlides.value = sessionSlides.value.length;
  }

  function resetRunTracking() {
    runStartedAtMs.value = null;
    runPlannedSlides.value = 0;
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
      completedSlides: normalizedCompletedSlides
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
