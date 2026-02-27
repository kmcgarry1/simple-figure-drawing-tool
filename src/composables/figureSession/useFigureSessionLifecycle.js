import { onBeforeUnmount, watch } from "vue";
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
  let persistTimeoutId = null;

  function clearPersistTimer() {
    if (persistTimeoutId !== null) {
      clearTimeout(persistTimeoutId);
      persistTimeoutId = null;
    }
  }

  function persistPreferencesNow() {
    persistSessionPreferences({
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
    });
  }

  function schedulePersistPreferences() {
    clearPersistTimer();
    persistTimeoutId = setTimeout(() => {
      persistTimeoutId = null;
      persistPreferencesNow();
    }, 150);
  }

  watch(
    [
      sessionMode,
      durationSeconds,
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
    {
      deep: true
    }
  );

  watch(phase, (nextPhase, previousPhase) => {
    if (nextPhase === "complete" && previousPhase !== "complete") {
      recordSessionHistory("completed", runPlannedSlides.value);
    }
  });

  onBeforeUnmount(() => {
    if (persistTimeoutId !== null) {
      clearPersistTimer();
      persistPreferencesNow();
    }
    clearTimers();
    revokeSlideUrl();
    clearPreloadedSlide();
  });
}
