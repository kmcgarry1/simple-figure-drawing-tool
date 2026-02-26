import { onBeforeUnmount, ref, watch } from "vue";
import { FILE_INPUT_ACCEPT } from "../config";
import { CLASS_PRESET_OPTIONS, createBlocksFromPreset } from "../utils/classPlan";
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

  const remainingMs = ref(0);
  const activeSlideDurationMs = ref(0);

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
    uploadNotice,
    hasSourcePhotos,
    classTotalMinutesText,
    classDeltaText,
    clearTimers,
    revokeSlideUrl,
    resetPlaybackState
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
    const hasSet = prepareActiveSet();
    if (!hasSet) {
      return;
    }

    if (autoStart) {
      startPreparedSession();
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
      avoidImmediateRepeats
    ],
    () => {
      persistSessionPreferences({
        sessionMode: sessionMode.value,
        durationSeconds: durationSeconds.value,
        classPresetId: classPresetId.value,
        classBlocks: classBlocks.value,
        classPhotoOrder: classPhotoOrder.value,
        avoidImmediateRepeats: avoidImmediateRepeats.value
      });
    },
    {
      deep: true
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
    classTemplates,
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
    exportSettingsJson,
    importSettingsFromFile,
    saveClassTemplateByName,
    loadClassTemplateById,
    deleteClassTemplateById,
    startFreshSession,
    togglePause,
    goToNextSlide,
    createNewRandomSet,
    stopSession,
    applyDurationChange,
    handlePhotoSelection
  };
}
