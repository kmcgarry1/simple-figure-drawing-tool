import { computed } from "vue";
import {
  calculateClassPlanSummary,
  getClassPresetById
} from "../../utils/classPlan";
import { SESSION_MODE_CLASS } from "./constants";
import { formatClockFromMs, formatDurationShort } from "./formatters";

export function useFigureSessionDerivedState({
  sourcePhotos,
  sessionSlides,
  currentIndex,
  phase,
  sessionMode,
  classBlocks,
  classPresetId,
  remainingMs,
  activeSlideDurationMs
}) {
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

  const totalClassPoseSlides = computed(
    () => sessionSlides.value.filter((slide) => slide.kind !== "break").length
  );

  const slideCounterText = computed(() => {
    if (sessionMode.value !== SESSION_MODE_CLASS) {
      const total = sessionSlides.value.length;
      const current = currentIndex.value >= 0 ? currentIndex.value + 1 : 0;
      return `Slide ${current} / ${total}`;
    }

    const totalClassPoses = totalClassPoseSlides.value;
    if (currentIndex.value < 0) {
      return `Pose 0 / ${totalClassPoses}`;
    }

    const active = activeSlide.value;
    if (active?.kind === "break") {
      return `Break ${active.breakNumber || 0}`;
    }

    return `Pose ${active?.poseNumber || 0} / ${totalClassPoses}`;
  });

  const timeLeftText = computed(() => formatClockFromMs(remainingMs.value));
  const activePoseLabel = computed(() => {
    if (activeSlide.value?.label) {
      return activeSlide.value.label;
    }
    return sessionMode.value === SESSION_MODE_CLASS ? "Class Pose" : "Quick Pose";
  });

  const totalSessionDurationMs = computed(() =>
    sessionSlides.value.reduce((total, slide) => total + slide.durationMs, 0)
  );

  const upcomingSessionDurationMs = computed(() => {
    let upcomingMs = 0;
    for (let index = currentIndex.value + 1; index < sessionSlides.value.length; index += 1) {
      upcomingMs += sessionSlides.value[index].durationMs;
    }
    return upcomingMs;
  });

  const sessionRemainingMs = computed(() => {
    if (sessionSlides.value.length === 0) {
      return 0;
    }

    if (currentIndex.value < 0) {
      return totalSessionDurationMs.value;
    }

    return Math.max(0, remainingMs.value) + upcomingSessionDurationMs.value;
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
        ? "Class set prepared. Press Start Class to review pose slots."
        : "Random set prepared. Press Start Session.";
    }
    return "Preparing session...";
  });

  return {
    hasSourcePhotos,
    isRunning,
    isPaused,
    isSessionLive,
    pauseLabel,
    activeSlide,
    hasClassPlan,
    classTargetMinutes,
    classPoseCount,
    classDeltaText,
    classTotalMinutesText,
    startActionLabel,
    regenerateActionLabel,
    restartActionLabel,
    slideCounterText,
    timeLeftText,
    activePoseLabel,
    sessionTimeLeftText,
    timerFillPercent,
    placeholderText
  };
}
