<template>
  <section class="fd-card grid gap-4 rounded-2xl p-4">
    <div class="grid gap-1">
      <p class="fd-text-strong text-base font-semibold">Photo order and tags</p>
      <p class="fd-text-muted text-sm">
        Reorder photos and assign tags for specific class blocks. Upload order matters only when class sequence uses
        sequential mode.
      </p>
      <p v-if="availablePhotoTags.length > 0" class="fd-text-muted text-sm">
        Active tags: {{ availablePhotoTags.join(", ") }}
      </p>
      <p v-else class="fd-text-muted text-sm">No tags assigned yet.</p>
    </div>

    <section class="fd-subtle-card grid gap-3 rounded-2xl p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="grid gap-1">
          <p class="fd-section-label">Bulk Tag Actions</p>
          <p class="fd-text-muted text-sm">{{ selectedPhotoCount }} selected</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <BaseButton compact tone="subtle" :disabled="taggedPhotos.length === 0" @click="selectAllPhotos">
            Select All
          </BaseButton>
          <BaseButton compact tone="subtle" :disabled="selectedPhotoCount === 0" @click="clearSelectedPhotos">
            Clear Selection
          </BaseButton>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <label class="grid gap-1.5 text-sm" for="bulkPhotoTagInput">
          <span class="fd-text-muted">Tag Name</span>
          <input
            id="bulkPhotoTagInput"
            v-model="bulkTagValue"
            type="text"
            placeholder="gesture"
            class="fd-input w-full rounded-xl px-3 py-2 text-sm"
          />
        </label>
        <BaseButton compact tone="subtle" :disabled="!canApplyBulkTag" @click="applyTagToSelectedPhotos">
          Apply Tag
        </BaseButton>
        <BaseButton compact tone="subtle" :disabled="!canRemoveBulkTag" @click="removeTagFromSelectedPhotos">
          Remove Tag
        </BaseButton>
      </div>
    </section>

    <div class="fd-library-list" role="list" aria-label="Source photo order">
      <article
        v-for="(photo, index) in taggedPhotos"
        :key="photo.id"
        role="listitem"
        :data-photo-id="photo.id"
        :aria-grabbed="draggedPhotoId === photo.id ? 'true' : 'false'"
        class="fd-library-row"
        :class="{
          'is-dragging': draggedPhotoId === photo.id,
          'is-drop-target': dropTargetPhotoId === photo.id && draggedPhotoId !== photo.id
        }"
        draggable="true"
        @dragstart="onDragStart($event, photo.id)"
        @dragenter.prevent="onDragEnter(photo.id)"
        @dragover="onDragOver"
        @drop="onDrop($event, photo.id)"
        @dragend="onDragEnd"
      >
        <div class="flex items-start gap-3">
          <div class="fd-library-thumb">
            <img
              v-if="previewUrlsById[photo.id]"
              class="h-full w-full object-cover"
              :src="previewUrlsById[photo.id]"
              :alt="`Thumbnail for ${photo.name}`"
            />
            <div
              v-else
              class="grid h-full w-full place-items-center text-xs font-semibold uppercase tracking-[0.08em] fd-text-muted"
            >
              IMG
            </div>
          </div>

          <div class="min-w-0 flex-1 grid gap-3">
            <div class="fd-row-actions">
              <label class="fd-check-inline">
                <input
                  type="checkbox"
                  class="fd-check-input"
                  :checked="isPhotoSelected(photo.id)"
                  :aria-label="`Select ${photo.name} for bulk tag actions`"
                  @change="setPhotoSelection(photo.id, $event.target.checked)"
                />
                <span>Select</span>
              </label>

              <span class="truncate fd-text-strong text-sm font-semibold">
                {{ index + 1 }}. {{ photo.name }}
              </span>

              <div class="flex gap-2">
                <BaseButton
                  compact
                  tone="subtle"
                  :disabled="index === 0"
                  :aria-label="`Move ${photo.name} up`"
                  @click="requestPhotoReorder(photo.id, 'up')"
                >
                  Up
                </BaseButton>
                <BaseButton
                  compact
                  tone="subtle"
                  :disabled="index === taggedPhotos.length - 1"
                  :aria-label="`Move ${photo.name} down`"
                  @click="requestPhotoReorder(photo.id, 'down')"
                >
                  Down
                </BaseButton>
              </div>
            </div>

            <input
              type="text"
              :value="photo.tag"
              :aria-label="`Tag for ${photo.name}`"
              placeholder="Tag name (leave empty for all)"
              class="fd-input w-full rounded-xl px-3 py-2 text-sm"
              @change="onTagChange(photo.id, $event)"
            />
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import BaseButton from "./BaseButton.vue";

const props = defineProps({
  taggedPhotos: {
    type: Array,
    required: true
  },
  availablePhotoTags: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(["photo-tag-update", "photo-tag-batch-update", "photo-reorder"]);

const previewUrlsById = ref({});
const draggedPhotoId = ref("");
const dropTargetPhotoId = ref("");
const selectedPhotoIds = ref(new Set());
const bulkTagValue = ref("");

const selectedPhotoCount = computed(() => selectedPhotoIds.value.size);
const normalizedBulkTagValue = computed(() => String(bulkTagValue.value || "").trim());
const canApplyBulkTag = computed(
  () => selectedPhotoCount.value > 0 && normalizedBulkTagValue.value.length > 0
);
const canRemoveBulkTag = computed(() => selectedPhotoCount.value > 0);

function createObjectUrl(file) {
  if (!(file instanceof Blob)) {
    return "";
  }

  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    return "";
  }

  return URL.createObjectURL(file);
}

function revokeObjectUrl(url) {
  if (!url || typeof URL === "undefined" || typeof URL.revokeObjectURL !== "function") {
    return;
  }

  URL.revokeObjectURL(url);
}

watch(
  () => props.taggedPhotos,
  (nextPhotos) => {
    const nextPreviewUrlsById = {};

    for (const photo of nextPhotos) {
      const existingUrl = previewUrlsById.value[photo.id];
      if (existingUrl) {
        nextPreviewUrlsById[photo.id] = existingUrl;
        continue;
      }

      const createdUrl = createObjectUrl(photo.file);
      if (createdUrl) {
        nextPreviewUrlsById[photo.id] = createdUrl;
      }
    }

    for (const [photoId, existingUrl] of Object.entries(previewUrlsById.value)) {
      if (!nextPreviewUrlsById[photoId]) {
        revokeObjectUrl(existingUrl);
      }
    }

    const availablePhotoIds = new Set(nextPhotos.map((photo) => photo.id));
    selectedPhotoIds.value = new Set(
      Array.from(selectedPhotoIds.value).filter((photoId) => availablePhotoIds.has(photoId))
    );

    previewUrlsById.value = nextPreviewUrlsById;
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  for (const url of Object.values(previewUrlsById.value)) {
    revokeObjectUrl(url);
  }
  previewUrlsById.value = {};
});

function onTagChange(photoId, event) {
  emit("photo-tag-update", {
    photoId,
    tag: event.target.value
  });
}

function requestPhotoReorder(photoId, direction) {
  emit("photo-reorder", { photoId, direction });
}

function isPhotoSelected(photoId) {
  return selectedPhotoIds.value.has(photoId);
}

function setPhotoSelection(photoId, isSelected) {
  const nextSelected = new Set(selectedPhotoIds.value);
  if (isSelected) {
    nextSelected.add(photoId);
  } else {
    nextSelected.delete(photoId);
  }
  selectedPhotoIds.value = nextSelected;
}

function selectAllPhotos() {
  selectedPhotoIds.value = new Set(props.taggedPhotos.map((photo) => photo.id));
}

function clearSelectedPhotos() {
  selectedPhotoIds.value = new Set();
}

function applyTagToSelectedPhotos() {
  if (!canApplyBulkTag.value) {
    return;
  }

  emit("photo-tag-batch-update", {
    photoIds: Array.from(selectedPhotoIds.value),
    action: "set",
    tag: normalizedBulkTagValue.value
  });
}

function removeTagFromSelectedPhotos() {
  if (!canRemoveBulkTag.value) {
    return;
  }

  emit("photo-tag-batch-update", {
    photoIds: Array.from(selectedPhotoIds.value),
    action: "clear"
  });
}

function onDragStart(event, photoId) {
  draggedPhotoId.value = photoId;
  dropTargetPhotoId.value = "";

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", photoId);
  }
}

function onDragEnter(photoId) {
  if (!draggedPhotoId.value || draggedPhotoId.value === photoId) {
    dropTargetPhotoId.value = "";
    return;
  }

  dropTargetPhotoId.value = photoId;
}

function onDragOver(event) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

function onDrop(event, targetPhotoId) {
  event.preventDefault();

  const transferPhotoId = event.dataTransfer?.getData("text/plain") || "";
  const sourcePhotoId = transferPhotoId || draggedPhotoId.value;
  if (!sourcePhotoId || sourcePhotoId === targetPhotoId) {
    onDragEnd();
    return;
  }

  const targetIndex = props.taggedPhotos.findIndex((photo) => photo.id === targetPhotoId);
  if (targetIndex < 0) {
    onDragEnd();
    return;
  }

  emit("photo-reorder", {
    photoId: sourcePhotoId,
    toIndex: targetIndex
  });
  onDragEnd();
}

function onDragEnd() {
  draggedPhotoId.value = "";
  dropTargetPhotoId.value = "";
}
</script>
