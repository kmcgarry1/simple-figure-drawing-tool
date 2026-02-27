<template>
  <section class="grid gap-3 rounded-lg border border-amber-200/80 bg-white/58 p-3">
    <div class="grid gap-1">
      <p class="text-sm font-semibold text-stone-800">Step 3: Advanced tools</p>
      <p class="text-xs text-stone-500">
        Fine-tune tags, transfer settings, and manage session history.
      </p>
    </div>

    <PhotoTagManagerSection
      v-if="taggedPhotos.length > 0"
      :tagged-photos="taggedPhotos"
      :available-photo-tags="availablePhotoTags"
      @photo-tag-update="$emit('photo-tag-update', $event)"
      @photo-reorder="$emit('photo-reorder', $event)"
    />

    <section class="grid gap-2 rounded-md border border-amber-200/80 bg-white/56 p-2.5">
      <p class="text-sm font-semibold text-stone-800">Settings Transfer</p>
      <div class="grid grid-cols-3 gap-2 max-[680px]:grid-cols-1">
        <BaseButton tone="subtle" @click="$emit('export-settings')">Export JSON</BaseButton>
        <BaseButton tone="subtle" @click="$emit('share-settings-link')">Copy Share Link</BaseButton>
        <label class="grid gap-1 text-xs text-stone-600">
          <span>Import JSON</span>
          <input
            type="file"
            accept="application/json,.json"
            class="w-full rounded-md border border-amber-200/90 bg-white/84 px-2 py-1.5 text-xs text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            @change="$emit('import-settings', $event)"
          />
        </label>
      </div>
    </section>

    <SessionHistorySection :session-history="sessionHistory" @clear-history="$emit('clear-history')" />
  </section>
</template>

<script setup>
import BaseButton from "../BaseButton.vue";
import PhotoTagManagerSection from "../PhotoTagManagerSection.vue";
import SessionHistorySection from "../SessionHistorySection.vue";

defineProps({
  taggedPhotos: {
    type: Array,
    required: true
  },
  availablePhotoTags: {
    type: Array,
    required: true
  },
  sessionHistory: {
    type: Array,
    required: true
  }
});

defineEmits([
  "photo-tag-update",
  "photo-reorder",
  "export-settings",
  "share-settings-link",
  "import-settings",
  "clear-history"
]);
</script>
