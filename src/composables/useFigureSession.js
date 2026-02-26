import { computed, onBeforeUnmount, ref, watch } from "vue";
import { FILE_INPUT_ACCEPT } from "../config";
import { CLASS_PRESET_OPTIONS, createBlocksFromPreset } from "../utils/classPlan";
import { createPhotoId } from "../utils/photoInput";
import { createClassPlanActions } from "./figureSession/classPlanActions";
import {
  getClassTemplateById,
  loadClassTemplates,
  persistClassTemplates,
  removeClassTemplateById,
  saveClassTemplate
} from "./figureSession/classTemplates";
import {
  PHOTO_ORDER_SHUFFLE,
  SESSION_MODE_CLASS,
  SESSION_MODE_QUICK
} from "./figureSession/constants";
import { useFigureSessionDerivedState } from "./figureSession/derivedState";
import {
  loadSessionPreferences,
  persistSessionPreferences
} from "./figureSession/persistence";
import { createPlaybackRuntime } from "./figureSession/playbackRuntime";
import {
  appendSessionHistory,
  clearSessionHistoryStore,
  loadSessionHistory,
  persistSessionHistory
} from "./figureSession/sessionHistory";
import {
  createSettingsExportPayload,
  parseSettingsImportText
} from "./figureSession/settingsTransfer";
import { createSetPreparationController } from "./figureSession/setPreparation";
import { IDLE_MESSAGE } from "./figureSession/sessionMessages";

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
  const photoTagsById = ref({});
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

  const taggedPhotos = computed(() =>
    sourcePhotos.value.map((file) => {
      const photoId = createPhotoId(file);
      return {
        id: photoId,
        name: file.name,
        tag: photoTagsById.value[photoId] || ""
      };
    })
  );

  const availablePhotoTags = computed(() =>
    Array.from(
      new Set(
        Object.values(photoTagsById.value)
          .map((tag) => String(tag).trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b))
  );

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

  function startFreshSession() {
    if (!hasSourcePhotos.value) {
      statusMessage.value = "Upload photos before starting.";
      return;
    }

    const hasSet = prepareActiveSet();
    if (!hasSet) {
      return;
    }

    runStartedAtMs.value = Date.now();
    runPlannedSlides.value = sessionSlides.value.length;
    startPreparedSession();
  }

  function recordSessionHistory(result, completedSlides) {
    if (!runStartedAtMs.value) {
      return;
    }

    const now = Date.now();
    const plannedSlides = runPlannedSlides.value || sessionSlides.value.length;
    const normalizedCompletedSlides = Math.min(
      plannedSlides,
      Math.max(0, Number.parseInt(String(completedSlides), 10) || 0)
    );

    sessionHistory.value = appendSessionHistory(sessionHistory.value, {
      id: `session-${now}-${Math.floor(Math.random() * 10000)}`,
      sessionMode: sessionMode.value,
      result,
      startedAt: new Date(runStartedAtMs.value).toISOString(),
      endedAt: new Date(now).toISOString(),
      elapsedSeconds: Math.max(0, Math.round((now - runStartedAtMs.value) / 1000)),
      plannedSlides,
      completedSlides: normalizedCompletedSlides
    });
    persistSessionHistory(sessionHistory.value);

    runStartedAtMs.value = null;
    runPlannedSlides.value = 0;
  }

  function applyDurationChange() {
    if (sessionMode.value !== SESSION_MODE_QUICK) {
      statusMessage.value = "Per-photo duration is only used in Quick Session mode.";
      return;
    }

    const duration = getQuickDurationSeconds();
    const durationMs = duration * 1000;
    const hasPreparedSlides = sessionSlides.value.length > 0;
    const isDurationUnchanged =
      hasPreparedSlides &&
      sessionSlides.value.every(
        (slide) => slide.durationSeconds === duration && slide.durationMs === durationMs
      );

    if (isDurationUnchanged) {
      statusMessage.value = `Duration remains at ${duration} seconds.`;
      return;
    }

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
    if (autoStart) {
      recordSessionHistory("ended", currentIndex.value);
    }

    const hasSet = prepareActiveSet();
    if (!hasSet) {
      return;
    }

    if (autoStart) {
      runStartedAtMs.value = Date.now();
      runPlannedSlides.value = sessionSlides.value.length;
      startPreparedSession();
    }
  }

  function endSession() {
    const completedSlidesBeforeStop = currentIndex.value;
    stopSession();
    recordSessionHistory("ended", completedSlidesBeforeStop);
  }

  function clearSessionHistory() {
    sessionHistory.value = [];
    clearSessionHistoryStore();
    statusMessage.value = "Session history cleared.";
  }

  function normalizePhotoTag(rawTag) {
    return String(rawTag ?? "").trim();
  }

  function syncPhotoTagsForSourcePhotos() {
    const nextTags = {};
    for (const file of sourcePhotos.value) {
      const photoId = createPhotoId(file);
      const normalizedTag = normalizePhotoTag(photoTagsById.value[photoId]);
      if (normalizedTag) {
        nextTags[photoId] = normalizedTag;
      }
    }
    photoTagsById.value = nextTags;
  }

  function handlePhotoSelectionWithTags(fileList) {
    handlePhotoSelection(fileList);
    syncPhotoTagsForSourcePhotos();
  }

  function updatePhotoTag({ photoId, tag }) {
    const normalizedTag = normalizePhotoTag(tag);
    const nextTags = { ...photoTagsById.value };

    if (!normalizedTag) {
      delete nextTags[photoId];
    } else {
      nextTags[photoId] = normalizedTag;
    }

    photoTagsById.value = nextTags;

    if (sessionMode.value === SESSION_MODE_CLASS && !isSessionLive.value && hasSourcePhotos.value) {
      prepareActiveSet();
    }
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
      statusMessage.value = IDLE_MESSAGE;
      return;
    }

    prepareActiveSet();
  }

  function toggleMirrorLiveView() {
    mirrorLiveView.value = !mirrorLiveView.value;
  }

  function toggleGrayscaleLiveView() {
    grayscaleLiveView.value = !grayscaleLiveView.value;
  }

  function toggleHideLiveOverlay() {
    hideLiveOverlay.value = !hideLiveOverlay.value;
  }

  function getCurrentPreferences() {
    return {
      sessionMode: sessionMode.value,
      durationSeconds: durationSeconds.value,
      classPresetId: classPresetId.value,
      classBlocks: classBlocks.value,
      classPhotoOrder: classPhotoOrder.value,
      avoidImmediateRepeats: avoidImmediateRepeats.value
    };
  }

  function exportSettingsJson() {
    if (typeof window === "undefined") {
      statusMessage.value = "Settings export is only available in the browser.";
      return;
    }

    const payload = createSettingsExportPayload(getCurrentPreferences());
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const blobUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadLink.href = blobUrl;
    downloadLink.download = `figure-drawing-settings-${dateStamp}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(blobUrl);
    statusMessage.value = "Settings exported to JSON.";
  }

  async function importSettingsFromFile(file) {
    if (!(file instanceof File)) {
      statusMessage.value = "Choose a JSON file to import.";
      return;
    }

    if (isSessionLive.value) {
      statusMessage.value = "End the current run before importing settings.";
      return;
    }

    try {
      const importedText = await file.text();
      const importedPreferences = parseSettingsImportText(importedText);

      sessionMode.value = importedPreferences.sessionMode;
      durationSeconds.value = importedPreferences.durationSeconds;
      classPresetId.value = importedPreferences.classPresetId;
      classBlocks.value = importedPreferences.classBlocks;
      classPhotoOrder.value = importedPreferences.classPhotoOrder;
      avoidImmediateRepeats.value = importedPreferences.avoidImmediateRepeats;

      clearTimers();
      revokeSlideUrl();
      resetPlaybackState();
      sessionSlides.value = [];

      if (hasSourcePhotos.value) {
        prepareActiveSet();
      } else {
        phase.value = "idle";
      }

      statusMessage.value = "Settings imported from JSON.";
    } catch {
      statusMessage.value = "Unable to import settings file.";
    }
  }

  function saveClassTemplateByName(templateName) {
    const result = saveClassTemplate(classTemplates.value, {
      name: templateName,
      blocks: classBlocks.value
    });
    if (!result.saved) {
      statusMessage.value = "Enter a template name before saving.";
      return;
    }

    classTemplates.value = result.templates;
    persistClassTemplates(classTemplates.value);
    statusMessage.value = result.updated
      ? `Updated template "${result.template.name}".`
      : `Saved template "${result.template.name}".`;
  }

  function loadClassTemplateById(templateId) {
    const template = getClassTemplateById(classTemplates.value, templateId);
    if (!template) {
      statusMessage.value = "Template not found.";
      return;
    }

    classBlocks.value = template.blocks.map((block) => ({ ...block }));
    statusMessage.value = `Loaded template "${template.name}".`;
  }

  function deleteClassTemplateById(templateId) {
    const existingCount = classTemplates.value.length;
    classTemplates.value = removeClassTemplateById(classTemplates.value, templateId);
    if (classTemplates.value.length === existingCount) {
      statusMessage.value = "Template not found.";
      return;
    }

    persistClassTemplates(classTemplates.value);
    statusMessage.value = "Template deleted.";
  }

  watch(
    [
      sessionMode,
      durationSeconds,
      classPresetId,
      classBlocks,
      classPhotoOrder,
      avoidImmediateRepeats,
      mirrorLiveView,
      grayscaleLiveView,
      hideLiveOverlay
    ],
    () => {
      persistSessionPreferences({
        sessionMode: sessionMode.value,
        durationSeconds: durationSeconds.value,
        classPresetId: classPresetId.value,
        classBlocks: classBlocks.value,
        classPhotoOrder: classPhotoOrder.value,
        avoidImmediateRepeats: avoidImmediateRepeats.value,
        mirrorLiveView: mirrorLiveView.value,
        grayscaleLiveView: grayscaleLiveView.value,
        hideLiveOverlay: hideLiveOverlay.value
      });
    },
    {
      deep: true
    }
  );

  watch(
    phase,
    (nextPhase, previousPhase) => {
      if (nextPhase === "complete" && previousPhase !== "complete") {
        recordSessionHistory("completed", runPlannedSlides.value);
      }
    }
  );

  onBeforeUnmount(() => {
    clearTimers();
    revokeSlideUrl();
    clearPreloadedSlide();
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
    handlePhotoSelection: handlePhotoSelectionWithTags
  };
}
