import { computed, onMounted, ref } from "vue";
import { FILE_INPUT_ACCEPT } from "../config";
import { CLASS_PRESET_OPTIONS, createBlocksFromPreset } from "../utils/classPlan";
import { PHOTO_ORDER_SHUFFLE } from "./figureSession/constants";
import { createSessionControllers } from "./figureSession/createSessionControllers";
import { useFigureSessionDerivedState } from "./figureSession/derivedState";
import { loadSessionPreferences } from "./figureSession/persistence";
import { IDLE_MESSAGE } from "./figureSession/sessionMessages";
import { loadClassTemplates } from "./figureSession/classTemplates";
import { loadSessionHistory } from "./figureSession/sessionHistory";
import { loadRunSnapshots } from "./figureSession/runSnapshots";
import { useFigureSessionLifecycle } from "./figureSession/useFigureSessionLifecycle";
import { formatDurationShort } from "./figureSession/formatters";
import { useAudioCues } from "./useAudioCues";
import { applyClassPoseFilesToSlides } from "./figureSession/slideFactory";

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
  const runSnapshots = ref(loadRunSnapshots());
  const photoTagsById = ref(persistedPreferences.photoTagsById || {});
  const mirrorLiveView = ref(Boolean(persistedPreferences.mirrorLiveView));
  const grayscaleLiveView = ref(Boolean(persistedPreferences.grayscaleLiveView));
  const hideLiveOverlay = ref(Boolean(persistedPreferences.hideLiveOverlay));
  const audioMuted = ref(Boolean(persistedPreferences.audioMuted));
  const audioVolumePercent = ref(Number(persistedPreferences.audioVolumePercent));

  const remainingMs = ref(0);
  const activeSlideDurationMs = ref(0);
  const runStartedAtMs = ref(null);
  const runPlannedSlides = ref(0);
  const isClassLaunchReviewOpen = ref(false);
  const classLaunchPoseFiles = ref([]);

  const currentSlideUrl = ref("");
  const currentSlideAlt = ref("");

  function initializeClassLaunchReviewAssignments() {
    classLaunchPoseFiles.value = sessionSlides.value
      .filter((slide) => slide.kind !== "break")
      .map((slide) => slide.file || null);
  }

  function clearClassLaunchReviewAssignments() {
    classLaunchPoseFiles.value = [];
  }

  function reorderClassLaunchReview({ fromIndex, toIndex }) {
    const from = Number.parseInt(String(fromIndex), 10);
    const to = Number.parseInt(String(toIndex), 10);
    const assignments = classLaunchPoseFiles.value;

    if (
      !Number.isInteger(from) ||
      !Number.isInteger(to) ||
      from < 0 ||
      to < 0 ||
      from >= assignments.length ||
      to >= assignments.length ||
      from === to
    ) {
      return;
    }

    const nextAssignments = assignments.slice();
    const [movedFile] = nextAssignments.splice(from, 1);
    nextAssignments.splice(to, 0, movedFile);
    classLaunchPoseFiles.value = nextAssignments;
  }

  function applyClassLaunchReviewAssignments() {
    sessionSlides.value = applyClassPoseFilesToSlides(
      sessionSlides.value,
      classLaunchPoseFiles.value
    );
  }

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
  const { playCountdownCue, playSlideCompleteCue } = useAudioCues({
    audioMuted,
    audioVolumePercent
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
    updatePhotoTagsBatch,
    reorderSourcePhoto,
    setClassPreset,
    updateClassBlock,
    addClassBlock,
    removeClassBlock,
    setClassPhotoOrder,
    setAvoidImmediateRepeats,
    applyClassBuilderAssistant,
    clearSessionHistory,
    rerunSessionFromHistory,
    saveRunSnapshotFromHistory,
    restoreRunSnapshot,
    deleteRunSnapshot,
    exportSettingsJson,
    importSettingsFromFile,
    copySettingsShareLink,
    applySettingsFromShareUrl,
    saveClassTemplateByName,
    loadClassTemplateById,
    deleteClassTemplateById,
    renameClassTemplateById,
    duplicateClassTemplateById,
    exportClassTemplatesJson,
    importClassTemplatesFromFile,
    startFreshSession,
    cancelClassLaunchReview,
    startClassFromReview,
    applyDurationChange,
    createNewRandomSet,
    endSession,
    setSessionMode,
    toggleMirrorLiveView,
    toggleGrayscaleLiveView,
    toggleHideLiveOverlay,
    toggleAudioMuted,
    setAudioVolumePercent
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
    runSnapshots,
    photoTagsById,
    mirrorLiveView,
    grayscaleLiveView,
    hideLiveOverlay,
    audioMuted,
    audioVolumePercent,
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
    slideCounterText,
    isClassLaunchReviewOpen,
    initializeClassLaunchReviewAssignments,
    clearClassLaunchReviewAssignments,
    applyClassLaunchReviewAssignments,
    onCountdownCue: playCountdownCue,
    onSlideCompleteCue: playSlideCompleteCue
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
    audioMuted,
    audioVolumePercent,
    phase,
    runPlannedSlides,
    recordSessionHistory,
    clearTimers,
    revokeSlideUrl,
    clearPreloadedSlide
  });

  onMounted(() => {
    applySettingsFromShareUrl();
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

  const classLaunchReviewSlots = computed(() =>
    sessionSlides.value
      .filter((slide) => slide.kind !== "break")
      .map((slide, index) => {
        const assignedFile = classLaunchPoseFiles.value[index] || slide.file || null;
        const durationSeconds =
          Number.parseInt(String(slide.durationSeconds), 10) ||
          Math.max(0, Math.round((slide.durationMs || 0) / 1000));

        return {
          id: `pose-slot-${index + 1}`,
          poseNumber: slide.poseNumber || index + 1,
          label: slide.label || "Pose",
          durationText: formatDurationShort(durationSeconds),
          file: assignedFile,
          fileName: assignedFile?.name || "No image selected"
        };
      })
  );

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
    runSnapshots,
    mirrorLiveView,
    grayscaleLiveView,
    hideLiveOverlay,
    audioMuted,
    audioVolumePercent,
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
    applyClassBuilderAssistant,
    toggleMirrorLiveView,
    toggleGrayscaleLiveView,
    toggleHideLiveOverlay,
    toggleAudioMuted,
    setAudioVolumePercent,
    exportSettingsJson,
    importSettingsFromFile,
    copySettingsShareLink,
    saveClassTemplateByName,
    loadClassTemplateById,
    deleteClassTemplateById,
    renameClassTemplateById,
    duplicateClassTemplateById,
    exportClassTemplatesJson,
    importClassTemplatesFromFile,
    startFreshSession,
    isClassLaunchReviewOpen,
    classLaunchReviewSlots,
    reorderClassLaunchReview,
    cancelClassLaunchReview,
    startClassFromReview,
    togglePause,
    goToNextSlide,
    createNewRandomSet,
    stopSession: endSession,
    clearSessionHistory,
    rerunSessionFromHistory,
    saveRunSnapshotFromHistory,
    restoreRunSnapshot,
    deleteRunSnapshot,
    applyDurationChange,
    updatePhotoTag,
    updatePhotoTagsBatch,
    reorderSourcePhoto,
    handlePhotoSelection: handlePhotoSelectionWithTags
  };
}
