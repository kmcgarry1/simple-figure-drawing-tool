import { createClassPlanActions } from "./classPlanActions";
import { createClassTemplateActions } from "./classTemplateActions";
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
    slideCounterText
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
    setAvoidImmediateRepeats
  } = createClassPlanActions({
    classPresetId,
    classBlocks,
    classPhotoOrder,
    avoidImmediateRepeats,
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
    runPlannedSlides
  });

  const { exportSettingsJson, importSettingsFromFile } = createSettingsTransferActions({
    sessionMode,
    durationSeconds,
    classPresetId,
    classBlocks,
    classPhotoOrder,
    avoidImmediateRepeats,
    photoTagsById,
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

  const { saveClassTemplateByName, loadClassTemplateById, deleteClassTemplateById } =
    createClassTemplateActions({
      classTemplates,
      classBlocks,
      statusMessage
    });

  const {
    startFreshSession,
    applyDurationChange,
    createNewRandomSet,
    endSession,
    setSessionMode,
    toggleMirrorLiveView,
    toggleGrayscaleLiveView,
    toggleHideLiveOverlay
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
    mirrorLiveView,
    grayscaleLiveView,
    hideLiveOverlay
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
  };
}
