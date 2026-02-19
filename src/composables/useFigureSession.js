import { computed, onBeforeUnmount, ref } from "vue";
import {
  DEFAULT_DURATION_SECONDS,
  FILE_INPUT_ACCEPT,
  SESSION_PHOTO_LIMIT
} from "../config";
import {
  chooseRandomPhotos,
  clampDurationSeconds,
  normalizeUploadedPhotos
} from "../utils/photoInput";

export function useFigureSession() {
  const sourcePhotos = ref([]);
  const sessionPhotos = ref([]);
  const currentIndex = ref(-1);

  const phase = ref("idle");
  const statusMessage = ref("Upload at least 1 photo to begin.");
  const uploadNotice = ref("");

  const durationSeconds = ref(DEFAULT_DURATION_SECONDS);
  const remainingMs = ref(0);
  const activeSlideDurationMs = ref(0);

  const currentSlideUrl = ref("");
  const currentSlideAlt = ref("");

  let slideTimeoutId = null;
  let tickIntervalId = null;
  let deadline = 0;

  const hasSourcePhotos = computed(() => sourcePhotos.value.length > 0);
  const isRunning = computed(() => phase.value === "running");
  const isPaused = computed(() => phase.value === "paused");
  const isSessionLive = computed(() => isRunning.value || isPaused.value);
  const pauseLabel = computed(() => (isPaused.value ? "Resume" : "Pause"));

  const slideCounterText = computed(() => {
    const total = sessionPhotos.value.length;
    const current = currentIndex.value >= 0 ? currentIndex.value + 1 : 0;
    return `${current} / ${total}`;
  });

  const timeLeftText = computed(() => {
    const secondsLeft = Math.ceil(Math.max(0, remainingMs.value) / 1000);
    return `${secondsLeft}s`;
  });

  const timerFillPercent = computed(() => {
    if (activeSlideDurationMs.value <= 0) {
      return 0;
    }

    const ratio = Math.max(0, Math.min(1, remainingMs.value / activeSlideDurationMs.value));
    return ratio * 100;
  });

  const placeholderText = computed(() => {
    if (!hasSourcePhotos.value) {
      return "Your slideshow will appear here.";
    }
    if (phase.value === "complete") {
      return "Session complete. Start a new round when ready.";
    }
    if (phase.value === "ready") {
      return "Random set prepared. Press Start Session.";
    }
    return "Preparing session...";
  });

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

  function getDurationMs() {
    const clamped = clampDurationSeconds(durationSeconds.value);
    durationSeconds.value = clamped;
    return clamped * 1000;
  }

  function showCurrentSlide() {
    const file = sessionPhotos.value[currentIndex.value];
    if (!file) {
      revokeSlideUrl();
      return;
    }

    revokeSlideUrl();
    currentSlideUrl.value = URL.createObjectURL(file);
    currentSlideAlt.value = `Slide ${currentIndex.value + 1}: ${file.name}`;
  }

  function prepareRandomSet() {
    if (!hasSourcePhotos.value) {
      sessionPhotos.value = [];
      currentIndex.value = -1;
      remainingMs.value = 0;
      activeSlideDurationMs.value = 0;
      phase.value = "idle";
      statusMessage.value = "Upload at least 1 photo to begin.";
      revokeSlideUrl();
      return false;
    }

    const pickCount = Math.min(SESSION_PHOTO_LIMIT, sourcePhotos.value.length);
    sessionPhotos.value = chooseRandomPhotos(sourcePhotos.value, pickCount);
    currentIndex.value = -1;
    remainingMs.value = 0;
    activeSlideDurationMs.value = 0;
    phase.value = "ready";
    revokeSlideUrl();

    statusMessage.value =
      sessionPhotos.value.length < SESSION_PHOTO_LIMIT
        ? `Random set ready: ${sessionPhotos.value.length} photo(s) selected (fewer than ${SESSION_PHOTO_LIMIT} uploaded).`
        : `Random set ready: ${SESSION_PHOTO_LIMIT} photos selected.`;

    return true;
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
    if (sessionPhotos.value.length === 0) {
      return;
    }

    currentIndex.value = 0;
    activeSlideDurationMs.value = getDurationMs();
    remainingMs.value = activeSlideDurationMs.value;
    phase.value = "running";
    showCurrentSlide();
    scheduleCurrentSlide();
    statusMessage.value = `Running session with ${sessionPhotos.value.length} photo(s).`;
  }

  function startFreshSession() {
    if (!hasSourcePhotos.value) {
      statusMessage.value = "Upload photos before starting.";
      return;
    }

    const hasSet = prepareRandomSet();
    if (!hasSet) {
      return;
    }

    startPreparedSession();
  }

  function finishSession() {
    clearTimers();
    phase.value = "complete";
    remainingMs.value = 0;
    activeSlideDurationMs.value = 0;
    statusMessage.value = "Session complete. Press Start Session for a new round.";
  }

  function advanceSlide() {
    if (!isRunning.value) {
      return;
    }

    if (currentIndex.value >= sessionPhotos.value.length - 1) {
      finishSession();
      return;
    }

    currentIndex.value += 1;
    activeSlideDurationMs.value = getDurationMs();
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
      activeSlideDurationMs.value = getDurationMs();
      remainingMs.value = activeSlideDurationMs.value;
    }

    phase.value = "running";
    scheduleCurrentSlide();
    statusMessage.value = "Session resumed.";
  }

  function applyDurationChange() {
    const durationMs = getDurationMs();

    if (isRunning.value) {
      activeSlideDurationMs.value = durationMs;
      remainingMs.value = durationMs;
      scheduleCurrentSlide();
      statusMessage.value = `Duration updated to ${durationMs / 1000} seconds.`;
      return;
    }

    if (isPaused.value) {
      activeSlideDurationMs.value = durationMs;
      remainingMs.value = durationMs;
      statusMessage.value = `Duration updated to ${durationMs / 1000} seconds.`;
      return;
    }

    statusMessage.value = `Duration set to ${durationMs / 1000} seconds.`;
  }

  function createNewRandomSet() {
    const autoStart = isSessionLive.value;
    const hasSet = prepareRandomSet();
    if (!hasSet) {
      return;
    }

    if (autoStart) {
      startPreparedSession();
    }
  }

  function stopSession() {
    clearTimers();
    remainingMs.value = 0;
    activeSlideDurationMs.value = 0;
    phase.value = hasSourcePhotos.value ? "ready" : "idle";
    statusMessage.value = "Session stopped.";
  }

  function handlePhotoSelection(fileList) {
    clearTimers();
    revokeSlideUrl();

    const { photos, notices } = normalizeUploadedPhotos(fileList);
    sourcePhotos.value = photos;
    sessionPhotos.value = [];
    currentIndex.value = -1;
    remainingMs.value = 0;
    activeSlideDurationMs.value = 0;
    uploadNotice.value = notices.join(" ");

    if (!hasSourcePhotos.value) {
      phase.value = "idle";
      statusMessage.value = "Upload at least 1 valid photo to begin.";
      return;
    }

    prepareRandomSet();
  }

  onBeforeUnmount(() => {
    clearTimers();
    revokeSlideUrl();
  });

  return {
    fileInputAccept: FILE_INPUT_ACCEPT,
    durationSeconds,
    statusMessage,
    uploadNotice,
    currentSlideUrl,
    currentSlideAlt,
    hasSourcePhotos,
    isRunning,
    isPaused,
    isSessionLive,
    pauseLabel,
    slideCounterText,
    timeLeftText,
    timerFillPercent,
    placeholderText,
    startFreshSession,
    togglePause,
    goToNextSlide,
    createNewRandomSet,
    stopSession,
    applyDurationChange,
    handlePhotoSelection
  };
}
