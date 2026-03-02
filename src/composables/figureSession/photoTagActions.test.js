import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createPhotoId } from "../../utils/photoInput";
import { createPhotoTagActions } from "./photoTagActions";

function createPhoto(index) {
  return {
    name: `pose-${index}.jpg`,
    size: index * 100,
    lastModified: index * 1000
  };
}

function createHarness({ sessionMode = "class" } = {}) {
  const photos = [createPhoto(1), createPhoto(2), createPhoto(3)];
  const sourcePhotos = ref(photos);
  const photoTagsById = ref({});
  const prepareActiveSet = vi.fn();
  const statusMessage = ref("");

  const actions = createPhotoTagActions({
    sourcePhotos,
    photoTagsById,
    sessionMode: ref(sessionMode),
    isSessionLive: ref(false),
    hasSourcePhotos: ref(true),
    statusMessage,
    prepareActiveSet,
    handlePhotoSelection: vi.fn()
  });

  return {
    photos,
    photoTagsById,
    prepareActiveSet,
    statusMessage,
    actions
  };
}

describe("createPhotoTagActions.updatePhotoTagsBatch", () => {
  it("applies the selected tag to multiple photos in one update", () => {
    const { photos, photoTagsById, prepareActiveSet, statusMessage, actions } = createHarness();
    const firstPhotoId = createPhotoId(photos[0]);
    const secondPhotoId = createPhotoId(photos[1]);

    actions.updatePhotoTagsBatch({
      photoIds: [firstPhotoId, secondPhotoId],
      action: "set",
      tag: "gesture"
    });

    expect(photoTagsById.value).toEqual({
      [firstPhotoId]: "gesture",
      [secondPhotoId]: "gesture"
    });
    expect(statusMessage.value).toBe('Applied tag "gesture" to 2 photos.');
    expect(prepareActiveSet).toHaveBeenCalledTimes(1);
  });

  it("removes tags from the selected photos only", () => {
    const { photos, photoTagsById, prepareActiveSet, statusMessage, actions } = createHarness();
    const firstPhotoId = createPhotoId(photos[0]);
    const secondPhotoId = createPhotoId(photos[1]);
    const thirdPhotoId = createPhotoId(photos[2]);

    photoTagsById.value = {
      [firstPhotoId]: "gesture",
      [secondPhotoId]: "long-pose",
      [thirdPhotoId]: "hands"
    };

    actions.updatePhotoTagsBatch({
      photoIds: [firstPhotoId, secondPhotoId],
      action: "clear"
    });

    expect(photoTagsById.value).toEqual({
      [thirdPhotoId]: "hands"
    });
    expect(statusMessage.value).toBe("Removed tags from 2 photos.");
    expect(prepareActiveSet).toHaveBeenCalledTimes(1);
  });

  it("ignores set requests when the requested bulk tag is empty", () => {
    const { photos, photoTagsById, prepareActiveSet, statusMessage, actions } = createHarness();
    const firstPhotoId = createPhotoId(photos[0]);

    actions.updatePhotoTagsBatch({
      photoIds: [firstPhotoId],
      action: "set",
      tag: "   "
    });

    expect(photoTagsById.value).toEqual({});
    expect(statusMessage.value).toBe("");
    expect(prepareActiveSet).not.toHaveBeenCalled();
  });
});
