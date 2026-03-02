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

    if (sessionMode.value === SESSION_MODE_CLASS && !isSessionLive.value && hasSourcePhotos.value) {
      prepareActiveSet();
    }
  }

  return {
    taggedPhotos,
    availablePhotoTags,
    handlePhotoSelectionWithTags,
    updatePhotoTag,
    reorderSourcePhoto
  };
}
