import {
  createSettingsExportPayload,
  parseSettingsImportText
} from "./settingsTransfer";

export function createSettingsTransferActions({
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
}) {
  function getCurrentPreferences() {
    return {
      sessionMode: sessionMode.value,
      durationSeconds: durationSeconds.value,
      classPresetId: classPresetId.value,
      classBlocks: classBlocks.value,
      classPhotoOrder: classPhotoOrder.value,
      avoidImmediateRepeats: avoidImmediateRepeats.value,
      photoTagsById: photoTagsById.value,
      audioMuted: audioMuted.value,
      audioVolumePercent: audioVolumePercent.value
    };
  }

  function resetPreparedSession() {
    clearTimers();
    revokeSlideUrl();
    resetPlaybackState();
    sessionSlides.value = [];
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
      photoTagsById.value = importedPreferences.photoTagsById;
      audioMuted.value = importedPreferences.audioMuted;
      audioVolumePercent.value = importedPreferences.audioVolumePercent;

      resetPreparedSession();

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

  return {
    exportSettingsJson,
    importSettingsFromFile
  };
}
