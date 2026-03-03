import { CLASS_BLOCK_TYPE_BREAK, sanitizeClassBlocks } from "../../utils/classPlan";
import { createClassPlanActions } from "./classPlanActions";
import { createClassTemplateActions } from "./classTemplateActions";
import { findClassTemplateMatch } from "./classTemplates";
import { SESSION_MODE_CLASS, SESSION_MODE_QUICK } from "./constants";
import { createPlaybackRuntime } from "./playbackRuntime";
import { createPhotoTagActions } from "./photoTagActions";
import { normalizeHistoryRerunSettings } from "./sessionHistory";
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
    updatePhotoTagsBatch,
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
      const rerunSettings = {
        sessionMode: sessionMode.value,
        durationSeconds: durationSeconds.value,
        classPresetId: classPresetId.value,
        classBlocks: sanitizeClassBlocks(classBlocks.value).map((block) => ({ ...block })),
        classPhotoOrder: classPhotoOrder.value,
        avoidImmediateRepeats: avoidImmediateRepeats.value
      };

      if (sessionMode.value !== SESSION_MODE_CLASS) {
        return {
          templateName: "",
          appliedTags: [],
          rerunSettings
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
        appliedTags,
        rerunSettings
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

  function rerunSessionFromHistory(sessionId) {
    const normalizedSessionId = String(sessionId ?? "").trim();
    if (!normalizedSessionId) {
      return;
    }

    if (isSessionLive.value) {
      statusMessage.value = "End the current run before rerunning from history.";
      return;
    }

    const historyEntry = Array.from(sessionHistory.value || []).find(
      (entry) => entry?.id === normalizedSessionId
    );
    if (!historyEntry) {
      statusMessage.value = "Selected history run is no longer available.";
      return;
    }

    const rerunSettings = normalizeHistoryRerunSettings(historyEntry.rerunSettings, {
      fallbackSessionMode: historyEntry.sessionMode
    });

    sessionMode.value = rerunSettings.sessionMode;
    durationSeconds.value = rerunSettings.durationSeconds;
    classPresetId.value = rerunSettings.classPresetId;
    classBlocks.value = rerunSettings.classBlocks.map((block) => ({ ...block }));
    classPhotoOrder.value = rerunSettings.classPhotoOrder;
    avoidImmediateRepeats.value = rerunSettings.avoidImmediateRepeats;

    isClassLaunchReviewOpen.value = false;
    clearClassLaunchReviewAssignments?.();
    clearTimers();
    revokeSlideUrl();
    resetPlaybackState();
    sessionSlides.value = [];

    if (!hasSourcePhotos.value) {
      const restoredModeLabel =
        rerunSettings.sessionMode === SESSION_MODE_QUICK ? "quick" : "class";
      statusMessage.value = `Restored ${restoredModeLabel} setup. Add photos to start.`;
      return;
    }

    const hasPreparedSet = prepareActiveSet();
    if (!hasPreparedSet) {
      return;
    }

    const restoredModeLabel =
      rerunSettings.sessionMode === SESSION_MODE_QUICK ? "quick" : "class";
    statusMessage.value = `Restored ${restoredModeLabel} setup from session history. Review and start when ready.`;
  }

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
