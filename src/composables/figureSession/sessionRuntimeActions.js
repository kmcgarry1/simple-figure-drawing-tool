import {
  SESSION_MODE_CLASS,
  SESSION_MODE_QUICK
} from "./constants";
import { IDLE_MESSAGE } from "./sessionMessages";

export function createSessionRuntimeActions({
  sessionMode,
  phase,
  statusMessage,
  hasSourcePhotos,
  isSessionLive,
  isRunning,
  isPaused,
  getQuickDurationSeconds,
  sessionSlides,
  activeSlideDurationMs,
  remainingMs,
  scheduleCurrentSlide,
  prepareActiveSet,
  startPreparedSession,
  clearTimers,
  revokeSlideUrl,
  resetPlaybackState,
  currentIndex,
  stopSession,
  markRunStarted,
  recordSessionHistory,
  mirrorLiveView,
  grayscaleLiveView,
  hideLiveOverlay
}) {
  function startFreshSession() {
    if (!hasSourcePhotos.value) {
      statusMessage.value = "Upload photos before starting.";
      return;
    }

    const hasSet = prepareActiveSet();
    if (!hasSet) {
      return;
    }

    markRunStarted();
    startPreparedSession();
  }

  function applyDurationChange() {
    if (sessionMode.value !== SESSION_MODE_QUICK) {
      statusMessage.value = "Per-photo duration is only used in Quick Session mode.";
      return;
    }

    const duration = getQuickDurationSeconds();
    const durationMs = duration * 1000;
    const hasPreparedSlides = sessionSlides.value.length > 0;
    const isDurationUnchanged =
      hasPreparedSlides &&
      sessionSlides.value.every(
        (slide) => slide.durationSeconds === duration && slide.durationMs === durationMs
      );

    if (isDurationUnchanged) {
      statusMessage.value = `Duration remains at ${duration} seconds.`;
      return;
    }

    sessionSlides.value = sessionSlides.value.map((slide) => ({
      ...slide,
      durationSeconds: duration,
      durationMs
    }));

    if (isRunning.value) {
      activeSlideDurationMs.value = durationMs;
      remainingMs.value = durationMs;
      scheduleCurrentSlide();
      statusMessage.value = `Duration updated to ${duration} seconds.`;
      return;
    }

    if (isPaused.value) {
      activeSlideDurationMs.value = durationMs;
      remainingMs.value = durationMs;
      statusMessage.value = `Duration updated to ${duration} seconds.`;
      return;
    }

    statusMessage.value = `Duration set to ${duration} seconds.`;
  }

  function createNewRandomSet() {
    const autoStart = isSessionLive.value;
    if (autoStart) {
      recordSessionHistory("ended", currentIndex.value);
    }

    const hasSet = prepareActiveSet();
    if (!hasSet) {
      return;
    }

    if (autoStart) {
      markRunStarted();
      startPreparedSession();
    }
  }

  function endSession() {
    const completedSlidesBeforeStop = currentIndex.value;
    stopSession();
    recordSessionHistory("ended", completedSlidesBeforeStop);
  }

  function setSessionMode(nextMode) {
    if (![SESSION_MODE_QUICK, SESSION_MODE_CLASS].includes(nextMode)) {
      return;
    }

    if (nextMode === sessionMode.value) {
      return;
    }

    if (isSessionLive.value) {
      statusMessage.value = "End the current run before switching modes.";
      return;
    }

    sessionMode.value = nextMode;
    clearTimers();
    revokeSlideUrl();
    resetPlaybackState();
    sessionSlides.value = [];

    if (!hasSourcePhotos.value) {
      phase.value = "idle";
      statusMessage.value = IDLE_MESSAGE;
      return;
    }

    prepareActiveSet();
  }

  function toggleMirrorLiveView() {
    mirrorLiveView.value = !mirrorLiveView.value;
  }

  function toggleGrayscaleLiveView() {
    grayscaleLiveView.value = !grayscaleLiveView.value;
  }

  function toggleHideLiveOverlay() {
    hideLiveOverlay.value = !hideLiveOverlay.value;
  }

  return {
    startFreshSession,
    applyDurationChange,
    createNewRandomSet,
    endSession,
    setSessionMode,
    toggleMirrorLiveView,
    toggleGrayscaleLiveView,
    toggleHideLiveOverlay
  };
}
