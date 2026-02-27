import { onBeforeUnmount, ref, watch } from "vue";
import { persistSessionPreferences } from "./persistence";

export function useFigureSessionLifecycle({
  sessionMode,
  durationSeconds,
  classPresetId,
  classBlocks,
  classPhotoOrder,
  avoidImmediateRepeats,
  photoTagsById,
  mirrorLiveView,
  grayscaleLiveView,
  hideLiveOverlay,
  phase,
  runPlannedSlides,
  recordSessionHistory,
  clearTimers,
  revokeSlideUrl,
  clearPreloadedSlide
}) {
  const preferencesSaveState = ref("saved");
  const preferencesLastSavedAt = ref(null);

  let persistTimeoutId = null;
  let lastPersistedSnapshot = "";

  function buildPreferencesPayload() {
    return {
      sessionMode: sessionMode.value,
      durationSeconds: durationSeconds.value,
      classPresetId: classPresetId.value,
      classBlocks: classBlocks.value,
      classPhotoOrder: classPhotoOrder.value,
      avoidImmediateRepeats: avoidImmediateRepeats.value,
      photoTagsById: photoTagsById.value,
      mirrorLiveView: mirrorLiveView.value,
      grayscaleLiveView: grayscaleLiveView.value,
      hideLiveOverlay: hideLiveOverlay.value
    };
  }

  function clearPersistTimer() {
    if (persistTimeoutId !== null) {
      clearTimeout(persistTimeoutId);
      persistTimeoutId = null;
    }
  }

  function markPreferencesDirty() {
    preferencesSaveState.value = "saving";
  }

  function persistPreferencesNow() {
    const payload = buildPreferencesPayload();
    const serializedPayload = JSON.stringify(payload);
    if (serializedPayload === lastPersistedSnapshot) {
      if (preferencesSaveState.value === "saving") {
        preferencesSaveState.value = "saved";
      }
      return true;
    }

    const persisted = persistSessionPreferences(payload);
    if (persisted) {
      lastPersistedSnapshot = serializedPayload;
      preferencesSaveState.value = "saved";
      preferencesLastSavedAt.value = Date.now();
      return true;
    }

    preferencesSaveState.value = "error";
    return false;
  }

  function schedulePersistPreferences() {
    markPreferencesDirty();
    clearPersistTimer();
    persistTimeoutId = setTimeout(() => {
      persistTimeoutId = null;
      persistPreferencesNow();
    }, 150);
  }

  watch(
    [sessionMode, durationSeconds],
    () => {
      markPreferencesDirty();
      clearPersistTimer();
      persistPreferencesNow();
    }
  );

  watch(
    [
      classPresetId,
      classBlocks,
      classPhotoOrder,
      avoidImmediateRepeats,
      photoTagsById,
      mirrorLiveView,
      grayscaleLiveView,
      hideLiveOverlay
    ],
    schedulePersistPreferences,
    { deep: true }
  );

  watch(phase, (nextPhase, previousPhase) => {
    if (nextPhase === "complete" && previousPhase !== "complete") {
      recordSessionHistory("completed", runPlannedSlides.value);
    }
  });

  function flushPersistForLifecycleEvent() {
    clearPersistTimer();
    persistPreferencesNow();
  }

  function handleVisibilityChange() {
    if (document.visibilityState === "hidden") {
      flushPersistForLifecycleEvent();
    }
  }

  function handlePageHide() {
    flushPersistForLifecycleEvent();
  }

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);
  }

  onBeforeUnmount(() => {
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    }

    clearPersistTimer();
    persistPreferencesNow();
    clearTimers();
    revokeSlideUrl();
    clearPreloadedSlide();
  });

  return {
    preferencesSaveState,
    preferencesLastSavedAt
  };
}
