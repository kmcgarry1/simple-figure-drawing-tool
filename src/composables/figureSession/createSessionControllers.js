import { CLASS_BLOCK_TYPE_BREAK, sanitizeClassBlocks } from "../../utils/classPlan";
import { createClassPlanActions } from "./classPlanActions";
import { createClassTemplateActions } from "./classTemplateActions";
import { findClassTemplateMatch } from "./classTemplates";
import { SESSION_MODE_CLASS } from "./constants";
import { createPlaybackRuntime } from "./playbackRuntime";
import { createPhotoTagActions } from "./photoTagActions";
import { createSessionHistoryActions } from "./sessionHistoryActions";
import { createSessionRuntimeActions } from "./sessionRuntimeActions";
import { createSettingsTransferActions } from "./settingsTransferActions";
import { createSetPreparationController } from "./setPreparation";

export function createSessionControllers({
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
  onCountdownCue,
  onSlideCompleteCue
}) {
  const {
    clearTimers,
    revokeSlideUrl,
    clearPreloadedSlide,
    resetPlaybackState,
    scheduleCurrentSlide,
    startPreparedSession,
    goToNextSlide,
    togglePause,
    stopSession
  } = createPlaybackRuntime({
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
  });

  const {
    getQuickDurationSeconds,
    prepareActiveSet,
    handlePhotoSelection
  } = createSetPreparationController({
    sourcePhotos,
    sessionSlides,
    phase,
    statusMessage,
    sessionMode,
    durationSeconds,
    classBlocks,
    classPhotoOrder,
    avoidImmediateRepeats,
    photoTagsById,
    uploadNotice,
    hasSourcePhotos,
    classTotalMinutesText,
    classDeltaText,
    clearTimers,
    revokeSlideUrl,
    resetPlaybackState
  });

  const {
    taggedPhotos,
    availablePhotoTags,
    handlePhotoSelectionWithTags,
    updatePhotoTag,
    reorderSourcePhoto
  } = createPhotoTagActions({
    sourcePhotos,
    photoTagsById,
    sessionMode,
    isSessionLive,
    hasSourcePhotos,
    statusMessage,
    prepareActiveSet,
    handlePhotoSelection
  });

  const {
    setClassPreset,
    updateClassBlock,
    addClassBlock,
    removeClassBlock,
    setClassPhotoOrder,
    setAvoidImmediateRepeats,
    applyClassBuilderAssistant
  } = createClassPlanActions({
    classPresetId,
    classBlocks,
    classPhotoOrder,
    avoidImmediateRepeats,
    availablePhotoTags,
    sessionMode,
    isSessionLive,
    statusMessage
  });

  const {
    markRunStarted,
    recordSessionHistory,
    clearSessionHistory
  } = createSessionHistoryActions({
    sessionHistory,
    sessionMode,
    sessionSlides,
    statusMessage,
    runStartedAtMs,
    runPlannedSlides,
    getSessionHistoryContext: () => {
      if (sessionMode.value !== SESSION_MODE_CLASS) {
        return {
          templateName: "",
          appliedTags: []
        };
      }

      const safeClassBlocks = sanitizeClassBlocks(classBlocks.value);
      const matchingTemplate = findClassTemplateMatch(classTemplates.value, safeClassBlocks);
      const appliedTags = Array.from(
        new Set(
          safeClassBlocks
            .filter((block) => block.blockType !== CLASS_BLOCK_TYPE_BREAK)
            .map((block) => String(block.photoTag || "").trim())
            .filter((tag) => tag && tag !== "all")
        )
      );

      return {
        templateName: matchingTemplate?.name || "Custom Class Plan",
        appliedTags
      };
    }
  });

  const {
    exportSettingsJson,
    importSettingsFromFile,
    copySettingsShareLink,
    applySettingsFromShareUrl
  } = createSettingsTransferActions({
    sessionMode,
    durationSeconds,
    classPresetId,
    classBlocks,
    classPhotoOrder,
    avoidImmediateRepeats,
    photoTagsById,
    audioMuted,
    audioVolumePercent,
    hasSourcePhotos,
    isSessionLive,
    phase,
    statusMessage,
    clearTimers,
    revokeSlideUrl,
    resetPlaybackState,
    sessionSlides,
    prepareActiveSet
  });

  const {
    saveClassTemplateByName,
    loadClassTemplateById,
    deleteClassTemplateById,
    renameClassTemplateById,
    duplicateClassTemplateById,
    exportClassTemplatesJson,
    importClassTemplatesFromFile
  } =
    createClassTemplateActions({
      classTemplates,
      classBlocks,
      statusMessage
    });

  const {
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
  } = createSessionRuntimeActions({
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
    isClassLaunchReviewOpen,
    initializeClassLaunchReviewAssignments,
    clearClassLaunchReviewAssignments,
    applyClassLaunchReviewAssignments,
    mirrorLiveView,
    grayscaleLiveView,
    hideLiveOverlay,
    audioMuted,
    audioVolumePercent
  });

  return {
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
    applyClassBuilderAssistant,
    clearSessionHistory,
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
  };
}
