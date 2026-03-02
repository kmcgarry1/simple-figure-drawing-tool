<template>
  <section class="grid gap-3.5 rounded-xl border border-amber-200/80 bg-white/58 p-4">
    <div class="grid gap-1">
      <p class="text-[15px] font-semibold text-stone-800">Step 3: Advanced tools</p>
      <p class="text-[13px] leading-5 text-stone-600">
        Fine-tune tags, transfer settings, and manage session history.
      </p>
    </div>

    <section class="fd-subtle-card grid gap-2 rounded-lg p-2.5">
      <button
        type="button"
        class="flex items-center justify-between gap-2 rounded-md border border-amber-200/75 bg-white/70 px-3 py-2 text-left text-[14px] font-semibold text-stone-800 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80"
        :aria-expanded="isOpen('tagging') ? 'true' : 'false'"
        @click="toggleSection('tagging')"
      >
        <span>Photo Tags And Order</span>
        <span class="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-600">{{ isOpen("tagging") ? "Hide" : "Show" }}</span>
      </button>
      <div v-if="isOpen('tagging')" class="grid gap-2">
        <PhotoTagManagerSection
          v-if="props.taggedPhotos.length > 0"
          :tagged-photos="props.taggedPhotos"
          :available-photo-tags="props.availablePhotoTags"
          @photo-tag-update="$emit('photo-tag-update', $event)"
          @photo-reorder="$emit('photo-reorder', $event)"
        />
        <p v-else class="text-[12px] leading-5 text-stone-600">Add photos in Step 1 to edit order and tags.</p>
      </div>
    </section>

    <section class="fd-subtle-card grid gap-2 rounded-lg p-2.5">
      <button
        type="button"
        class="flex items-center justify-between gap-2 rounded-md border border-amber-200/75 bg-white/70 px-3 py-2 text-left text-[14px] font-semibold text-stone-800 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80"
        :aria-expanded="isOpen('settings') ? 'true' : 'false'"
        @click="toggleSection('settings')"
      >
        <span>Settings Transfer</span>
        <span class="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-600">{{ isOpen("settings") ? "Hide" : "Show" }}</span>
      </button>
      <div v-if="isOpen('settings')" class="grid gap-2 rounded-md border border-amber-200/80 bg-white/56 p-2.5">
        <div class="grid grid-cols-3 gap-2 max-[680px]:grid-cols-1">
          <BaseButton tone="subtle" @click="$emit('export-settings')">Export JSON</BaseButton>
          <BaseButton tone="subtle" @click="$emit('share-settings-link')">Copy Share Link</BaseButton>
          <label class="grid gap-1 text-[12px] text-stone-700">
            <span>Import JSON</span>
            <input
              type="file"
              accept="application/json,.json"
              class="w-full rounded-md border border-amber-200/90 bg-white/84 px-2 py-1.5 text-xs text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              @change="$emit('import-settings', $event)"
            />
          </label>
        </div>
      </div>
    </section>

    <section class="fd-subtle-card grid gap-2 rounded-lg p-2.5">
      <button
        type="button"
        class="flex items-center justify-between gap-2 rounded-md border border-amber-200/75 bg-white/70 px-3 py-2 text-left text-[14px] font-semibold text-stone-800 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80"
        :aria-expanded="isOpen('history') ? 'true' : 'false'"
        @click="toggleSection('history')"
      >
        <span>Session History</span>
        <span class="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-600">{{ isOpen("history") ? "Hide" : "Show" }}</span>
      </button>
      <SessionHistorySection
        v-if="isOpen('history')"
        :session-history="props.sessionHistory"
        @clear-history="$emit('clear-history')"
      />
    </section>
  </section>
</template>

<script setup>
import { ref } from "vue";
import BaseButton from "../BaseButton.vue";
import PhotoTagManagerSection from "../PhotoTagManagerSection.vue";
import SessionHistorySection from "../SessionHistorySection.vue";

const props = defineProps({
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

const openSections = ref(new Set(["tagging", "settings"]));

function isOpen(sectionName) {
  return openSections.value.has(sectionName);
}

function toggleSection(sectionName) {
  const nextOpen = new Set(openSections.value);
  if (nextOpen.has(sectionName)) {
    nextOpen.delete(sectionName);
  } else {
    nextOpen.add(sectionName);
  }

  openSections.value = nextOpen;
}
</script>
