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
  slideCounterText,
  onCountdownCue,
  onSlideCompleteCue
}) {
  let slideTimeoutId = null;
  let tickIntervalId = null;
  let deadline = 0;
  let preloadedSlideUrl = "";
  let preloadedSlideIndex = -1;
  let preloadedSlideImage = null;

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

  function clearPreloadedSlide() {
    if (preloadedSlideUrl) {
      URL.revokeObjectURL(preloadedSlideUrl);
    }

    preloadedSlideUrl = "";
    preloadedSlideIndex = -1;
    preloadedSlideImage = null;
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
    clearPreloadedSlide();
  }

  function preloadNextSlide() {
    clearPreloadedSlide();

    const nextIndex = currentIndex.value + 1;
    const nextSlide = sessionSlides.value[nextIndex];
    if (!nextSlide?.file) {
      return;
    }

    preloadedSlideIndex = nextIndex;
    preloadedSlideUrl = URL.createObjectURL(nextSlide.file);
    preloadedSlideImage = new Image();
    preloadedSlideImage.src = preloadedSlideUrl;

    if (typeof preloadedSlideImage.decode === "function") {
      preloadedSlideImage.decode().catch(() => {});
    }
  }

  function showCurrentSlide() {
    const slide = activeSlide.value;
    if (!slide?.file) {
      revokeSlideUrl();
      return;
    }

    revokeSlideUrl();

    if (preloadedSlideIndex === currentIndex.value && preloadedSlideUrl) {
      currentSlideUrl.value = preloadedSlideUrl;
      preloadedSlideUrl = "";
      preloadedSlideIndex = -1;
      preloadedSlideImage = null;
    } else {
      currentSlideUrl.value = URL.createObjectURL(slide.file);
    }

    currentSlideAlt.value = `${slideCounterText.value}: ${slide.file.name}`;
    preloadNextSlide();
  }

  function scheduleCurrentSlide() {
    clearTimers();
    const delay = Math.max(1, remainingMs.value);
    remainingMs.value = delay;
    deadline = Date.now() + delay;
    let lastCountdownSecond = null;

    slideTimeoutId = setTimeout(() => {
      advanceSlide();
    }, delay);

    tickIntervalId = setInterval(() => {
      remainingMs.value = Math.max(0, deadline - Date.now());
      const secondsLeft = Math.ceil(remainingMs.value / 1000);
      const shouldPlayCountdownCue = secondsLeft > 0 && secondsLeft <= 3;
      if (shouldPlayCountdownCue && secondsLeft !== lastCountdownSecond) {
        onCountdownCue?.(secondsLeft);
        lastCountdownSecond = secondsLeft;
      } else if (!shouldPlayCountdownCue) {
        lastCountdownSecond = null;
      }
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
    const activeSlideCount =
      sessionMode.value === SESSION_MODE_CLASS
        ? sessionSlides.value.filter((slide) => slide.kind !== "break").length
        : sessionSlides.value.length;
    statusMessage.value = runningMessageForMode(
      sessionMode.value,
      activeSlideCount,
      SESSION_MODE_CLASS
    );
  }

  function finishSession() {
    clearTimers();
    revokeSlideUrl();
    clearPreloadedSlide();
    phase.value = "complete";
    remainingMs.value = 0;
    activeSlideDurationMs.value = 0;
    statusMessage.value = completionMessageForMode(sessionMode.value, SESSION_MODE_CLASS);
  }

  function advanceSlide() {
    if (!isRunning.value) {
      return;
    }

    onSlideCompleteCue?.();

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
    clearPreloadedSlide();
    resetPlaybackState();
    phase.value = hasSourcePhotos.value ? "ready" : "idle";
    statusMessage.value = stopMessageForMode(sessionMode.value, SESSION_MODE_CLASS);
  }

  return {
    clearTimers,
    revokeSlideUrl,
    clearPreloadedSlide,
    resetPlaybackState,
    scheduleCurrentSlide,
    startPreparedSession,
    goToNextSlide,
    togglePause,
    stopSession
  };
}
