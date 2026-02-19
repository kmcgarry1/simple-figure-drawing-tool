import { computed, onBeforeUnmount, ref } from "vue";
import { DEFAULT_DURATION_SECONDS, FILE_INPUT_ACCEPT, SESSION_PHOTO_LIMIT } from "../config";
import {
  CLASS_PRESET_OPTIONS,
  calculateClassPlanSummary,
  createBlocksFromPreset,
  getClassPresetById
} from "../utils/classPlan";
import { clampDurationSeconds, normalizeUploadedPhotos } from "../utils/photoInput";
import {
  appendClassBlock,
  removeClassBlock as removeClassBlockByIndex,
  updateClassBlocks
} from "./figureSession/classBlockEditor";
import {
  PHOTO_ORDER_SEQUENTIAL,
  PHOTO_ORDER_SHUFFLE,
  SESSION_MODE_CLASS,
  SESSION_MODE_QUICK
} from "./figureSession/constants";
import { formatClockFromMs, formatDurationShort } from "./figureSession/formatters";
import { createClassSlides, createQuickSlides } from "./figureSession/slideFactory";

function defaultIdleMessage() {
  return "Upload at least 1 photo to begin.";
}

function defaultInvalidUploadMessage() {
  return "Upload at least 1 valid photo to begin.";
}

export function useFigureSession() {
  const sourcePhotos = ref([]);
  const sessionSlides = ref([]);
  const currentIndex = ref(-1);

  const phase = ref("idle");
  const statusMessage = ref(defaultIdleMessage());
  const uploadNotice = ref("");

  const sessionMode = ref(SESSION_MODE_CLASS);
  const durationSeconds = ref(DEFAULT_DURATION_SECONDS);

  const classPresetId = ref(CLASS_PRESET_OPTIONS[0].id);
  const classBlocks = ref(createBlocksFromPreset(classPresetId.value));
  const classPhotoOrder = ref(PHOTO_ORDER_SHUFFLE);
  const avoidImmediateRepeats = ref(true);

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

  const activeSlide = computed(() => {
    if (currentIndex.value < 0) {
      return null;
    }
    return sessionSlides.value[currentIndex.value] || null;
  });

  const classPlanSummary = computed(() => calculateClassPlanSummary(classBlocks.value));
  const hasClassPlan = computed(() => classPlanSummary.value.totalPoses > 0);
  const classTargetMinutes = computed(() => getClassPresetById(classPresetId.value).targetMinutes);
  const classPoseCount = computed(() => classPlanSummary.value.totalPoses);
  const classDurationDeltaSeconds = computed(
    () => classPlanSummary.value.totalSeconds - classTargetMinutes.value * 60
  );
  const classDeltaText = computed(() => {
    if (classDurationDeltaSeconds.value === 0) {
      return "On target";
    }

    const magnitudeText = formatDurationShort(Math.abs(classDurationDeltaSeconds.value));
    return classDurationDeltaSeconds.value > 0
      ? `${magnitudeText} over target`
      : `${magnitudeText} under target`;
  });
  const classTotalMinutesText = computed(() => formatDurationShort(classPlanSummary.value.totalSeconds));

  const startActionLabel = computed(() =>
    sessionMode.value === SESSION_MODE_CLASS ? "Start Class" : "Start Session"
  );
  const regenerateActionLabel = computed(() =>
    sessionMode.value === SESSION_MODE_CLASS ? "Regenerate Class Set" : "New Random Set"
  );
  const restartActionLabel = computed(() =>
    sessionMode.value === SESSION_MODE_CLASS ? "Restart Class" : "New Set"
  );

  const slideCounterText = computed(() => {
    const total = sessionSlides.value.length;
    const current = currentIndex.value >= 0 ? currentIndex.value + 1 : 0;
    const prefix = sessionMode.value === SESSION_MODE_CLASS ? "Pose" : "Slide";
    return `${prefix} ${current} / ${total}`;
  });

  const timeLeftText = computed(() => formatClockFromMs(remainingMs.value));
  const activePoseLabel = computed(() => {
    if (activeSlide.value?.label) {
      return activeSlide.value.label;
    }
    return sessionMode.value === SESSION_MODE_CLASS ? "Class Pose" : "Quick Pose";
  });

  const sessionRemainingMs = computed(() => {
    if (sessionSlides.value.length === 0) {
      return 0;
    }

    if (currentIndex.value < 0) {
      return sessionSlides.value.reduce((total, slide) => total + slide.durationMs, 0);
    }

    let upcomingMs = 0;
    for (let index = currentIndex.value + 1; index < sessionSlides.value.length; index += 1) {
      upcomingMs += sessionSlides.value[index].durationMs;
    }

    return Math.max(0, remainingMs.value) + upcomingMs;
  });
  const sessionTimeLeftText = computed(() => formatClockFromMs(sessionRemainingMs.value));

  const timerFillPercent = computed(() => {
    if (activeSlideDurationMs.value <= 0) {
      return 0;
    }

    const ratio = Math.max(0, Math.min(1, remainingMs.value / activeSlideDurationMs.value));
    return ratio * 100;
  });

  const placeholderText = computed(() => {
    if (!hasSourcePhotos.value) {
      return "Upload photos to build your next class.";
    }
    if (phase.value === "complete") {
      return "Session complete. Start another round when ready.";
    }
    if (phase.value === "ready") {
      return sessionMode.value === SESSION_MODE_CLASS
        ? "Class set prepared. Press Start Class."
        : "Random set prepared. Press Start Session.";
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

  function resetPlaybackState() {
    currentIndex.value = -1;
    remainingMs.value = 0;
    activeSlideDurationMs.value = 0;
  }

  function setNoPhotosState(message = defaultIdleMessage()) {
    sessionSlides.value = [];
    resetPlaybackState();
    phase.value = "idle";
    statusMessage.value = message;
    revokeSlideUrl();
  }

  function getQuickDurationSeconds() {
    const clamped = clampDurationSeconds(durationSeconds.value);
    durationSeconds.value = clamped;
    return clamped;
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

  function prepareQuickSet() {
    if (!hasSourcePhotos.value) {
      setNoPhotosState();
      return false;
    }

    const duration = getQuickDurationSeconds();
    const { slides, selectedPhotosCount } = createQuickSlides(sourcePhotos.value, duration);

    sessionSlides.value = slides;
    resetPlaybackState();
    phase.value = "ready";
    revokeSlideUrl();

    statusMessage.value =
      selectedPhotosCount < SESSION_PHOTO_LIMIT
        ? `Random set ready: ${selectedPhotosCount} photo(s) selected (fewer than ${SESSION_PHOTO_LIMIT} uploaded).`
        : `Random set ready: ${SESSION_PHOTO_LIMIT} photos selected.`;

    return true;
  }

  function prepareClassSet() {
    if (!hasSourcePhotos.value) {
      setNoPhotosState();
      return false;
    }

    const { slides, safeBlocks, poseCount } = createClassSlides({
      sourcePhotos: sourcePhotos.value,
      classBlocks: classBlocks.value,
      classPhotoOrder: classPhotoOrder.value,
      avoidImmediateRepeats: avoidImmediateRepeats.value
    });

    classBlocks.value = safeBlocks;
    if (poseCount === 0) {
      setNoPhotosState("Add at least one pose block before starting.");
      return false;
    }

    sessionSlides.value = slides;
    resetPlaybackState();
    phase.value = "ready";
    revokeSlideUrl();

    statusMessage.value = `Class set ready: ${poseCount} poses, ${classTotalMinutesText.value} total (${classDeltaText.value}).`;
    return true;
  }

  function prepareActiveSet() {
    if (sessionMode.value === SESSION_MODE_CLASS) {
      return prepareClassSet();
    }
    return prepareQuickSet();
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
    statusMessage.value =
      sessionMode.value === SESSION_MODE_CLASS
        ? `Running class: ${sessionSlides.value.length} poses.`
        : `Running session with ${sessionSlides.value.length} photo(s).`;
  }

  function startFreshSession() {
    if (!hasSourcePhotos.value) {
      statusMessage.value = "Upload photos before starting.";
      return;
    }

    const hasSet = prepareActiveSet();
    if (!hasSet) {
      return;
    }

    startPreparedSession();
  }

  function finishSession() {
    clearTimers();
    revokeSlideUrl();
    phase.value = "complete";
    remainingMs.value = 0;
    activeSlideDurationMs.value = 0;
    statusMessage.value =
      sessionMode.value === SESSION_MODE_CLASS
        ? "Class complete. Press Start Class for another run."
        : "Session complete. Press Start Session for a new round.";
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

  function applyDurationChange() {
    if (sessionMode.value !== SESSION_MODE_QUICK) {
      statusMessage.value = "Per-photo duration is only used in Quick Session mode.";
      return;
    }

    const duration = getQuickDurationSeconds();
    const durationMs = duration * 1000;
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
    const hasSet = prepareActiveSet();
    if (!hasSet) {
      return;
    }

    if (autoStart) {
      startPreparedSession();
    }
  }

  function stopSession() {
    clearTimers();
    revokeSlideUrl();
    resetPlaybackState();
    phase.value = hasSourcePhotos.value ? "ready" : "idle";
    statusMessage.value = sessionMode.value === SESSION_MODE_CLASS ? "Class ended." : "Session stopped.";
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
      statusMessage.value = defaultIdleMessage();
      return;
    }

    prepareActiveSet();
  }

  function setClassPreset(nextPresetId) {
    const resolvedPreset = getClassPresetById(nextPresetId);
    classPresetId.value = resolvedPreset.id;
    classBlocks.value = createBlocksFromPreset(resolvedPreset.id);

    if (sessionMode.value === SESSION_MODE_CLASS && !isSessionLive.value) {
      statusMessage.value = "Preset updated. Review the blocks or start the class.";
    }
  }

  function updateClassBlock(payload) {
    classBlocks.value = updateClassBlocks(classBlocks.value, payload);

    if (sessionMode.value === SESSION_MODE_CLASS && !isSessionLive.value) {
      statusMessage.value = "Class plan updated.";
    }
  }

  function addClassBlock() {
    classBlocks.value = appendClassBlock(classBlocks.value);

    if (sessionMode.value === SESSION_MODE_CLASS && !isSessionLive.value) {
      statusMessage.value = "Added a custom block.";
    }
  }

  function removeClassBlock(index) {
    const nextBlocks = removeClassBlockByIndex(classBlocks.value, index);
    if (nextBlocks === classBlocks.value) {
      return;
    }

    classBlocks.value = nextBlocks;
    if (sessionMode.value === SESSION_MODE_CLASS && !isSessionLive.value) {
      statusMessage.value = "Removed a block.";
    }
  }

  function setClassPhotoOrder(nextOrder) {
    if (![PHOTO_ORDER_SHUFFLE, PHOTO_ORDER_SEQUENTIAL].includes(nextOrder)) {
      return;
    }

    classPhotoOrder.value = nextOrder;
  }

  function setAvoidImmediateRepeats(nextValue) {
    avoidImmediateRepeats.value = Boolean(nextValue);
  }

  function handlePhotoSelection(fileList) {
    clearTimers();
    revokeSlideUrl();

    const { photos, notices } = normalizeUploadedPhotos(fileList);
    sourcePhotos.value = photos;
    sessionSlides.value = [];
    resetPlaybackState();
    uploadNotice.value = notices.join(" ");

    if (!hasSourcePhotos.value) {
      phase.value = "idle";
      statusMessage.value = defaultInvalidUploadMessage();
      return;
    }

    prepareActiveSet();
  }

  onBeforeUnmount(() => {
    clearTimers();
    revokeSlideUrl();
  });

  return {
    fileInputAccept: FILE_INPUT_ACCEPT,
    sessionMode,
    durationSeconds,
    classPresetOptions: CLASS_PRESET_OPTIONS,
    classPresetId,
    classBlocks,
    classPhotoOrder,
    avoidImmediateRepeats,
    hasClassPlan,
    classTargetMinutes,
    classPoseCount,
    classTotalMinutesText,
    classDeltaText,
    startActionLabel,
    regenerateActionLabel,
    restartActionLabel,
    statusMessage,
    uploadNotice,
    currentSlideUrl,
    currentSlideAlt,
    activePoseLabel,
    sessionTimeLeftText,
    hasSourcePhotos,
    isRunning,
    isPaused,
    isSessionLive,
    pauseLabel,
    slideCounterText,
    timeLeftText,
    timerFillPercent,
    placeholderText,
    setSessionMode,
    setClassPreset,
    updateClassBlock,
    addClassBlock,
    removeClassBlock,
    setClassPhotoOrder,
    setAvoidImmediateRepeats,
    startFreshSession,
    togglePause,
    goToNextSlide,
    createNewRandomSet,
    stopSession,
    applyDurationChange,
    handlePhotoSelection
  };
}
