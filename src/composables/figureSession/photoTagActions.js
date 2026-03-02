import { computed } from "vue";
import { createPhotoId, movePhotoById, movePhotoByIdToIndex } from "../../utils/photoInput";
import { SESSION_MODE_CLASS } from "./constants";

export function createPhotoTagActions({
  sourcePhotos,
  photoTagsById,
  sessionMode,
  isSessionLive,
  hasSourcePhotos,
  statusMessage,
  prepareActiveSet,
  handlePhotoSelection
}) {
  const taggedPhotos = computed(() =>
    sourcePhotos.value.map((file) => {
      const photoId = createPhotoId(file);
      return {
        id: photoId,
        file,
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

  function normalizePhotoTag(rawTag) {
    return String(rawTag ?? "").trim();
  }

  function shouldRegenerateClassSet() {
    return sessionMode.value === SESSION_MODE_CLASS && !isSessionLive.value && hasSourcePhotos.value;
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

    if (shouldRegenerateClassSet()) {
      prepareActiveSet();
    }
  }

  function updatePhotoTagsBatch({ photoIds, tag, action }) {
    const selectedPhotoIds = Array.from(new Set(Array.from(photoIds || [])))
      .map((photoId) => String(photoId || "").trim())
      .filter(Boolean);
    if (selectedPhotoIds.length === 0) {
      return;
    }

    const availablePhotoIds = new Set(sourcePhotos.value.map((file) => createPhotoId(file)));
    const normalizedTag = normalizePhotoTag(tag);
    const normalizedAction = String(action || "").toLowerCase() === "clear" ? "clear" : "set";
    if (normalizedAction === "set" && !normalizedTag) {
      return;
    }

    let changedPhotoCount = 0;
    const nextTags = { ...photoTagsById.value };

    for (const photoId of selectedPhotoIds) {
      if (!availablePhotoIds.has(photoId)) {
        continue;
      }

      const currentTag = normalizePhotoTag(nextTags[photoId]);
      if (normalizedAction === "clear") {
        if (!currentTag) {
          continue;
        }

        delete nextTags[photoId];
        changedPhotoCount += 1;
        continue;
      }

      if (currentTag === normalizedTag) {
        continue;
      }

      nextTags[photoId] = normalizedTag;
      changedPhotoCount += 1;
    }

    if (changedPhotoCount <= 0) {
      return;
    }

    photoTagsById.value = nextTags;
    statusMessage.value =
      normalizedAction === "clear"
        ? `Removed tags from ${changedPhotoCount} photo${changedPhotoCount === 1 ? "" : "s"}.`
        : `Applied tag "${normalizedTag}" to ${changedPhotoCount} photo${changedPhotoCount === 1 ? "" : "s"}.`;

    if (shouldRegenerateClassSet()) {
      prepareActiveSet();
    }
  }

  function reorderSourcePhoto({ photoId, direction, toIndex }) {
    const parsedTargetIndex = Number(toIndex);
    const shouldMoveByIndex = Number.isInteger(parsedTargetIndex);
    const { photos, moved, toIndex: nextIndex } = shouldMoveByIndex
      ? movePhotoByIdToIndex(sourcePhotos.value, photoId, parsedTargetIndex)
      : movePhotoById(sourcePhotos.value, photoId, direction);
    if (!moved) {
      return;
    }

    sourcePhotos.value = photos;
    const movedPhoto = photos[nextIndex] || null;
    statusMessage.value = movedPhoto?.name
      ? `Photo order updated: ${movedPhoto.name} is now #${nextIndex + 1}.`
      : "Photo order updated.";

    if (shouldRegenerateClassSet()) {
      prepareActiveSet();
    }
  }

  return {
    taggedPhotos,
    availablePhotoTags,
    handlePhotoSelectionWithTags,
    updatePhotoTag,
    updatePhotoTagsBatch,
    reorderSourcePhoto
  };
}
