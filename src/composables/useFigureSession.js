import { computed, ref } from "vue";
import { FILE_INPUT_ACCEPT } from "../config";
import { CLASS_PRESET_OPTIONS, createBlocksFromPreset } from "../utils/classPlan";
import { PHOTO_ORDER_SHUFFLE } from "./figureSession/constants";
import { createSessionControllers } from "./figureSession/createSessionControllers";
import { useFigureSessionDerivedState } from "./figureSession/derivedState";
import { loadSessionPreferences } from "./figureSession/persistence";
import { IDLE_MESSAGE } from "./figureSession/sessionMessages";
import { loadClassTemplates } from "./figureSession/classTemplates";
import { loadSessionHistory } from "./figureSession/sessionHistory";
import { useFigureSessionLifecycle } from "./figureSession/useFigureSessionLifecycle";
import { formatDurationShort } from "./figureSession/formatters";

const SESSION_PREVIEW_LIMIT = 5;

export function useFigureSession() {
  const persistedPreferences = loadSessionPreferences();

  const sourcePhotos = ref([]);
  const sessionSlides = ref([]);
  const currentIndex = ref(-1);

  const phase = ref("idle");
  const statusMessage = ref(IDLE_MESSAGE);
  const uploadNotice = ref("");

  const sessionMode = ref(persistedPreferences.sessionMode);
  const durationSeconds = ref(persistedPreferences.durationSeconds);

  const classPresetId = ref(persistedPreferences.classPresetId || CLASS_PRESET_OPTIONS[0].id);
  const classBlocks = ref(
    persistedPreferences.classBlocks || createBlocksFromPreset(classPresetId.value)
  );
  const classTemplates = ref(loadClassTemplates());
  const classPhotoOrder = ref(persistedPreferences.classPhotoOrder || PHOTO_ORDER_SHUFFLE);
  const avoidImmediateRepeats = ref(
    persistedPreferences.avoidImmediateRepeats
  );
  const sessionHistory = ref(loadSessionHistory());
  const photoTagsById = ref(persistedPreferences.photoTagsById || {});
  const mirrorLiveView = ref(Boolean(persistedPreferences.mirrorLiveView));
  const grayscaleLiveView = ref(Boolean(persistedPreferences.grayscaleLiveView));
  const hideLiveOverlay = ref(Boolean(persistedPreferences.hideLiveOverlay));

  const remainingMs = ref(0);
  const activeSlideDurationMs = ref(0);
  const runStartedAtMs = ref(null);
  const runPlannedSlides = ref(0);

  const currentSlideUrl = ref("");
  const currentSlideAlt = ref("");

  const {
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
  } = useFigureSessionDerivedState({
    sourcePhotos,
    sessionSlides,
    currentIndex,
    phase,
    sessionMode,
    classBlocks,
    classPresetId,
    remainingMs,
    activeSlideDurationMs
  });

  const {
    clearTimers,
    revokeSlideUrl,
    clearPreloadedSlide,
    goToNextSlide,
    togglePause,
    recordSessionHistory,
    taggedPhotos,
    availablePhotoTags,
    handlePhotoSelectionWithTags,
    updatePhotoTag,
    reorderSourcePhoto,
    setClassPreset,
    updateClassBlock,
    addClassBlock,
    removeClassBlock,
    setClassPhotoOrder,
    setAvoidImmediateRepeats,
    clearSessionHistory,
    exportSettingsJson,
    importSettingsFromFile,
    saveClassTemplateByName,
    loadClassTemplateById,
    deleteClassTemplateById,
    startFreshSession,
    applyDurationChange,
    createNewRandomSet,
    endSession,
    setSessionMode,
    toggleMirrorLiveView,
    toggleGrayscaleLiveView,
    toggleHideLiveOverlay
  } = createSessionControllers({
    sourcePhotos,
    sessionSlides,
    currentIndex,
    phase,
    statusMessage,
    sessionMode,
    durationSeconds,
    classPresetId,
    classBlocks,
    classTemplates,
    classPhotoOrder,
    avoidImmediateRepeats,
    sessionHistory,
    photoTagsById,
    mirrorLiveView,
    grayscaleLiveView,
    hideLiveOverlay,
    uploadNotice,
    hasSourcePhotos,
    isRunning,
    isPaused,
    isSessionLive,
    activeSlide,
    classTotalMinutesText,
    classDeltaText,
    remainingMs,
    activeSlideDurationMs,
    runStartedAtMs,
    runPlannedSlides,
    currentSlideUrl,
    currentSlideAlt,
    slideCounterText
  });

  const { preferencesSaveState, preferencesLastSavedAt } = useFigureSessionLifecycle({
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
  });

  const saveTimeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  });

  const settingsSaveStatusText = computed(() => {
    if (preferencesSaveState.value === "saving") {
      return "Saving settings...";
    }

    if (preferencesSaveState.value === "error") {
      return "Unable to save settings in this browser.";
    }

    if (!preferencesLastSavedAt.value) {
      return "Settings autosave is ready.";
    }

    return `Settings saved at ${saveTimeFormatter.format(preferencesLastSavedAt.value)}.`;
  });

  const sessionPreviewItems = computed(() =>
    sessionSlides.value.slice(0, SESSION_PREVIEW_LIMIT).map((slide, index) => {
      const isBreak = slide.kind === "break";
      const sequenceNumber =
        slide.breakNumber || slide.poseNumber || index + 1;
      const durationSeconds =
        Number.parseInt(String(slide.durationSeconds), 10) ||
        Math.max(0, Math.round((slide.durationMs || 0) / 1000));
      const subtitleParts = [slide.label || (isBreak ? "Break" : "Pose")];

      if (!isBreak && slide.file?.name) {
        subtitleParts.push(slide.file.name);
      }

      return {
        id: `${isBreak ? "break" : "pose"}-${sequenceNumber}-${index}`,
        kind: isBreak ? "break" : "pose",
        title: isBreak ? `Break ${sequenceNumber}` : `Pose ${sequenceNumber}`,
        subtitle: subtitleParts.join(" | "),
        durationText: formatDurationShort(durationSeconds)
      };
    })
  );

  const sessionPreviewSummaryText = computed(() => {
    const totalSlides = sessionSlides.value.length;
    if (totalSlides <= 0) {
      return "No preview available yet.";
    }

    const poseCount = sessionSlides.value.filter((slide) => slide.kind !== "break").length;
    const breakCount = sessionSlides.value.filter((slide) => slide.kind === "break").length;
    const compositionParts = [];

    if (poseCount > 0) {
      compositionParts.push(`${poseCount} pose(s)`);
    }
    if (breakCount > 0) {
      compositionParts.push(`${breakCount} break(s)`);
    }

    const compositionText = compositionParts.join(" + ");
    const showingCount = Math.min(totalSlides, SESSION_PREVIEW_LIMIT);
    if (showingCount < totalSlides) {
      return `Showing first ${showingCount} of ${totalSlides} slides (${compositionText}).`;
    }

    return `Showing all ${totalSlides} slides (${compositionText}).`;
  });

  return {
    fileInputAccept: FILE_INPUT_ACCEPT,
    sessionMode,
    durationSeconds,
    classPresetOptions: CLASS_PRESET_OPTIONS,
    classPresetId,
    classBlocks,
    taggedPhotos,
    availablePhotoTags,
    classTemplates,
    classPhotoOrder,
    avoidImmediateRepeats,
    sessionHistory,
    mirrorLiveView,
    grayscaleLiveView,
    hideLiveOverlay,
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
    settingsSaveStatusText,
    sessionPreviewItems,
    sessionPreviewSummaryText,
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
    toggleMirrorLiveView,
    toggleGrayscaleLiveView,
    toggleHideLiveOverlay,
    exportSettingsJson,
    importSettingsFromFile,
    saveClassTemplateByName,
    loadClassTemplateById,
    deleteClassTemplateById,
    startFreshSession,
    togglePause,
    goToNextSlide,
    createNewRandomSet,
    stopSession: endSession,
    clearSessionHistory,
    applyDurationChange,
    updatePhotoTag,
    reorderSourcePhoto,
    handlePhotoSelection: handlePhotoSelectionWithTags
  };
}
