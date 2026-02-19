import { SESSION_MODE_CLASS } from "./constants";
import {
  completionMessageForMode,
  runningMessageForMode,
  stopMessageForMode
} from "./sessionMessages";

export function createPlaybackRuntime({
  phase,
  statusMessage,
  sessionMode,
  sessionSlides,
  currentIndex,
  remainingMs,
  activeSlideDurationMs,
  currentSlideUrl,
  currentSlideAlt,
  hasSourcePhotos,
  isRunning,
  isPaused,
  activeSlide,
  slideCounterText
}) {
  let slideTimeoutId = null;
  let tickIntervalId = null;
  let deadline = 0;

  function clearTimers() {
    if (slideTimeoutId !== null) {
      clearTimeout(slideTimeoutId);
      slideTimeoutId = null;
    }

    if (tickIntervalId !== null) {
      clearInterval(tickIntervalId);
      tickIntervalId = null;
    }
  }

  function revokeSlideUrl() {
    if (currentSlideUrl.value) {
      URL.revokeObjectURL(currentSlideUrl.value);
      currentSlideUrl.value = "";
      currentSlideAlt.value = "";
    }
  }

  function resetPlaybackState() {
    currentIndex.value = -1;
    remainingMs.value = 0;
    activeSlideDurationMs.value = 0;
  }

  function showCurrentSlide() {
    const slide = activeSlide.value;
    if (!slide?.file) {
      revokeSlideUrl();
      return;
    }

    revokeSlideUrl();
    currentSlideUrl.value = URL.createObjectURL(slide.file);
    currentSlideAlt.value = `${slideCounterText.value}: ${slide.file.name}`;
  }

  function scheduleCurrentSlide() {
    clearTimers();
    const delay = Math.max(1, remainingMs.value);
    remainingMs.value = delay;
    deadline = Date.now() + delay;

    slideTimeoutId = setTimeout(() => {
      advanceSlide();
    }, delay);

    tickIntervalId = setInterval(() => {
      remainingMs.value = Math.max(0, deadline - Date.now());
    }, 100);
  }

  function startPreparedSession() {
    if (sessionSlides.value.length === 0) {
      return;
    }

    currentIndex.value = 0;
    activeSlideDurationMs.value = sessionSlides.value[0].durationMs;
    remainingMs.value = activeSlideDurationMs.value;
    phase.value = "running";
    showCurrentSlide();
    scheduleCurrentSlide();
    statusMessage.value = runningMessageForMode(
      sessionMode.value,
      sessionSlides.value.length,
      SESSION_MODE_CLASS
    );
  }

  function finishSession() {
    clearTimers();
    revokeSlideUrl();
    phase.value = "complete";
    remainingMs.value = 0;
    activeSlideDurationMs.value = 0;
    statusMessage.value = completionMessageForMode(sessionMode.value, SESSION_MODE_CLASS);
  }

  function advanceSlide() {
    if (!isRunning.value) {
      return;
    }

    if (currentIndex.value >= sessionSlides.value.length - 1) {
      finishSession();
      return;
    }

    currentIndex.value += 1;
    activeSlideDurationMs.value = sessionSlides.value[currentIndex.value].durationMs;
    remainingMs.value = activeSlideDurationMs.value;
    showCurrentSlide();
    scheduleCurrentSlide();
  }

  function goToNextSlide() {
    if (!isRunning.value) {
      return;
    }

    clearTimers();
    advanceSlide();
  }

  function togglePause() {
    if (!isRunning.value && !isPaused.value) {
      return;
    }

    if (isRunning.value) {
      remainingMs.value = Math.max(0, deadline - Date.now());
      phase.value = "paused";
      clearTimers();
      statusMessage.value = "Session paused.";
      return;
    }

    if (remainingMs.value <= 0) {
      remainingMs.value = activeSlideDurationMs.value || 1000;
    }

    phase.value = "running";
    scheduleCurrentSlide();
    statusMessage.value = "Session resumed.";
  }

  function stopSession() {
    clearTimers();
    revokeSlideUrl();
    resetPlaybackState();
    phase.value = hasSourcePhotos.value ? "ready" : "idle";
    statusMessage.value = stopMessageForMode(sessionMode.value, SESSION_MODE_CLASS);
  }

  return {
    clearTimers,
    revokeSlideUrl,
    resetPlaybackState,
    scheduleCurrentSlide,
    startPreparedSession,
    goToNextSlide,
    togglePause,
    stopSession
  };
}
