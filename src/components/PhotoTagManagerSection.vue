<template>
  <section class="grid gap-2 rounded-lg border border-cyan-300/25 bg-slate-900/55 p-3">
    <p class="text-sm font-semibold text-slate-100">Photo Order and Tags</p>
    <p class="text-xs text-slate-300">
      Reorder photos and assign tags for specific class blocks. Order affects class runs when photo order is set to
      <strong>Sequential</strong>.
    </p>
    <p v-if="availablePhotoTags.length > 0" class="text-xs text-slate-300">
      Active tags: {{ availablePhotoTags.join(", ") }}
    </p>
    <p v-else class="text-xs text-slate-400">No tags assigned yet.</p>

    <div class="grid max-h-[24rem] gap-2 overflow-y-auto pr-1">
      <article
        v-for="(photo, index) in taggedPhotos"
        :key="photo.id"
        class="grid gap-2 rounded-lg border border-slate-700 bg-slate-950/60 p-2"
      >
        <div class="flex items-start gap-2">
          <div class="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-slate-600 bg-slate-900">
            <img
              v-if="previewUrlsById[photo.id]"
              class="h-full w-full object-cover"
              :src="previewUrlsById[photo.id]"
              :alt="`Thumbnail for ${photo.name}`"
            />
            <div
              v-else
              class="grid h-full w-full place-items-center text-[10px] font-semibold uppercase tracking-wide text-slate-400"
            >
              IMG
            </div>
          </div>

          <div class="min-w-0 flex-1 grid gap-1">
            <div class="flex items-center justify-between gap-2">
              <span class="truncate text-xs font-medium text-slate-100">
                {{ index + 1 }}. {{ photo.name }}
              </span>

              <div class="grid grid-flow-col gap-1">
                <button
                  type="button"
                  :disabled="index === 0"
                  class="rounded border border-slate-600 bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-35 disabled:hover:bg-slate-900"
                  :aria-label="`Move ${photo.name} up`"
                  @click="requestPhotoReorder(photo.id, 'up')"
                >
                  Up
                </button>
                <button
                  type="button"
                  :disabled="index === taggedPhotos.length - 1"
                  class="rounded border border-slate-600 bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-35 disabled:hover:bg-slate-900"
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
              placeholder="Tag name (leave empty for all)"
              class="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              @change="onTagChange(photo.id, $event)"
            />
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from "vue";

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

const emit = defineEmits(["photo-tag-update", "photo-reorder"]);

const previewUrlsById = ref({});

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
</script>
