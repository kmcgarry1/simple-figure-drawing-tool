import { SESSION_PHOTO_LIMIT } from "../../config";
import { clampDurationSeconds, normalizeUploadedPhotos } from "../../utils/photoInput";
import { SESSION_MODE_CLASS } from "./constants";
import { createClassSlides, createQuickSlides } from "./slideFactory";
import { IDLE_MESSAGE, INVALID_UPLOAD_MESSAGE } from "./sessionMessages";

export function createSetPreparationController({
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
}) {
  function setNoPhotosState(message = IDLE_MESSAGE) {
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

  function prepareQuickSet() {
    if (!hasSourcePhotos.value) {
      setNoPhotosState();
      return false;
    }

    const uploadedPhotoCount = sourcePhotos.value.length;
    const duration = getQuickDurationSeconds();
    const { slides, selectedPhotosCount } = createQuickSlides(
      sourcePhotos.value,
      duration
    );

    sessionSlides.value = slides;
    resetPlaybackState();
    phase.value = "ready";
    revokeSlideUrl();

    const discardedPhotoCount = Math.max(0, uploadedPhotoCount - selectedPhotosCount);
    if (discardedPhotoCount > 0) {
      statusMessage.value = `Random set ready: ${selectedPhotosCount} of ${uploadedPhotoCount} photo(s) selected. Source pool preserved.`;
      return true;
    }

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

    const { slides, safeBlocks, poseCount, fallbackTagBlocks } = createClassSlides({
      sourcePhotos: sourcePhotos.value,
      classBlocks: classBlocks.value,
      classPhotoOrder: classPhotoOrder.value,
      avoidImmediateRepeats: avoidImmediateRepeats.value,
      photoTagsById: photoTagsById.value
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

    const fallbackTagCount = fallbackTagBlocks.length;
    if (fallbackTagCount > 0) {
      const fallbackTags = Array.from(
        new Set(
          fallbackTagBlocks
            .map((block) => String(block.photoTag || "").trim())
            .filter(Boolean)
        )
      ).join(", ");
      statusMessage.value = `Class set ready: ${poseCount} poses, ${classTotalMinutesText.value} total (${classDeltaText.value}). ${fallbackTagCount} block(s) had no photo matches for tag(s): ${fallbackTags}. Used all photos for those blocks.`;
      return true;
    }

    statusMessage.value = `Class set ready: ${poseCount} poses, ${classTotalMinutesText.value} total (${classDeltaText.value}).`;
    return true;
  }

  function prepareActiveSet() {
    if (sessionMode.value === SESSION_MODE_CLASS) {
      return prepareClassSet();
    }
    return prepareQuickSet();
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
      statusMessage.value = INVALID_UPLOAD_MESSAGE;
      return;
    }

    prepareActiveSet();
  }

  return {
    setNoPhotosState,
    getQuickDurationSeconds,
    prepareActiveSet,
    handlePhotoSelection
  };
}
