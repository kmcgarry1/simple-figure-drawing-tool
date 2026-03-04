<template>
  <section class="fd-card grid gap-2 rounded-lg p-3">
    <p class="text-sm font-semibold text-stone-800">Photo Order and Tags</p>
    <p class="text-xs text-stone-600">
      Reorder photos and assign tags for specific class blocks. Order affects class runs when photo order is set to
      <strong>Sequential</strong>.
    </p>
    <p v-if="availablePhotoTags.length > 0" class="text-xs text-stone-600">
      Active tags: {{ availablePhotoTags.join(", ") }}
    </p>
    <p v-else class="text-xs text-stone-500">No tags assigned yet.</p>
    <p class="text-xs text-stone-600">Select multiple photos to apply or remove tags in one action.</p>

    <section class="fd-subtle-card grid gap-2 rounded-lg p-2.5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs font-semibold uppercase tracking-wide text-stone-600">Bulk Tag Actions</p>
        <p class="text-xs text-stone-600">{{ selectedPhotoCount }} selected</p>
      </div>
      <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <label class="grid gap-1 text-[11px] text-stone-600" for="bulkPhotoTagInput">
          <span>Tag Name</span>
          <input
            id="bulkPhotoTagInput"
            v-model="bulkTagValue"
            type="text"
            placeholder="gesture"
            class="fd-input w-full rounded-md px-2 py-1.5 text-xs"
          />
        </label>
        <button
          type="button"
          class="rounded border border-amber-200/90 bg-white/80 px-2.5 py-1.5 text-[11px] font-semibold text-stone-700 transition-colors hover:bg-white disabled:opacity-35 disabled:hover:bg-white/80"
          :disabled="!canApplyBulkTag"
          @click="applyTagToSelectedPhotos"
        >
          Apply Tag
        </button>
        <button
          type="button"
          class="rounded border border-amber-200/90 bg-white/80 px-2.5 py-1.5 text-[11px] font-semibold text-stone-700 transition-colors hover:bg-white disabled:opacity-35 disabled:hover:bg-white/80"
          :disabled="!canRemoveBulkTag"
          @click="removeTagFromSelectedPhotos"
        >
          Remove Tag
        </button>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded border border-amber-200/90 bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-700 transition-colors hover:bg-white disabled:opacity-35 disabled:hover:bg-white/80"
          :disabled="taggedPhotos.length === 0"
          @click="selectAllPhotos"
        >
          Select All
        </button>
        <button
          type="button"
          class="rounded border border-amber-200/90 bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-700 transition-colors hover:bg-white disabled:opacity-35 disabled:hover:bg-white/80"
          :disabled="selectedPhotoCount === 0"
          @click="clearSelectedPhotos"
        >
          Clear Selection
        </button>
      </div>
    </section>

    <div class="grid max-h-[24rem] gap-2 overflow-y-auto pr-1" role="list" aria-label="Source photo order">
      <article
        v-for="(photo, index) in taggedPhotos"
        :key="photo.id"
        role="listitem"
        :data-photo-id="photo.id"
        :aria-grabbed="draggedPhotoId === photo.id ? 'true' : 'false'"
        class="fd-subtle-card grid gap-2 rounded-lg p-2 transition-colors"
        :class="{
          'opacity-60 ring-2 ring-sky-300/80': draggedPhotoId === photo.id,
          'ring-2 ring-amber-300/80': dropTargetPhotoId === photo.id && draggedPhotoId !== photo.id
        }"
        draggable="true"
        @dragstart="onDragStart($event, photo.id)"
        @dragenter.prevent="onDragEnter(photo.id)"
        @dragover="onDragOver"
        @drop="onDrop($event, photo.id)"
        @dragend="onDragEnd"
      >
        <div class="flex items-start gap-2">
          <div class="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-amber-200/90 bg-white/84">
            <img
              v-if="previewUrlsById[photo.id]"
              class="h-full w-full object-cover"
              :src="previewUrlsById[photo.id]"
              :alt="`Thumbnail for ${photo.name}`"
            />
            <div
              v-else
              class="grid h-full w-full place-items-center text-[10px] font-semibold uppercase tracking-wide text-stone-500"
            >
              IMG
            </div>
          </div>

          <div class="min-w-0 flex-1 grid gap-1">
            <div class="flex items-center justify-between gap-2">
              <label class="inline-flex items-center gap-1.5 text-[11px] text-stone-600">
                <input
                  type="checkbox"
                  class="h-3.5 w-3.5 rounded border-stone-400 text-sky-700 focus:ring-sky-300"
                  :checked="isPhotoSelected(photo.id)"
                  :aria-label="`Select ${photo.name} for bulk tag actions`"
                  @change="setPhotoSelection(photo.id, $event.target.checked)"
                />
                Select
              </label>
              <span class="truncate text-xs font-medium text-stone-800">
                {{ index + 1 }}. {{ photo.name }}
              </span>

              <div class="grid grid-flow-col gap-1">
                <button
                  type="button"
                  :disabled="index === 0"
                  class="rounded border border-amber-200/90 bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700 transition-colors hover:bg-white disabled:opacity-35 disabled:hover:bg-white/80"
                  :aria-label="`Move ${photo.name} up`"
                  @click="requestPhotoReorder(photo.id, 'up')"
                >
                  Up
                </button>
                <button
                  type="button"
                  :disabled="index === taggedPhotos.length - 1"
                  class="rounded border border-amber-200/90 bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700 transition-colors hover:bg-white disabled:opacity-35 disabled:hover:bg-white/80"
                  :aria-label="`Move ${photo.name} down`"
                  @click="requestPhotoReorder(photo.id, 'down')"
                >
                  Down
                </button>
              </div>
            </div>

            <input
              type="text"
              :value="photo.tag"
              :aria-label="`Tag for ${photo.name}`"
              placeholder="Tag name (leave empty for all)"
              class="fd-input w-full rounded-md px-2 py-1.5 text-xs"
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
