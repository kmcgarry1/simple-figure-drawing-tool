<template>
  <section class="fd-callout grid gap-3.5 rounded-xl p-4">
    <div class="grid gap-1">
      <p class="fd-text-strong inline-flex items-center gap-2 text-[15px] font-semibold">
        <SlidersHorizontal class="h-4 w-4 text-lime-700" aria-hidden="true" />
        Step 3: Advanced tools
      </p>
      <p class="fd-text-muted text-[13px] leading-5">
        Fine-tune tags, transfer settings, and manage session history and snapshots.
      </p>
    </div>

    <section class="fd-subtle-card grid gap-2 rounded-lg p-2.5">
      <button
        type="button"
        class="fd-accordion-toggle flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[14px] font-semibold"
        :aria-expanded="isOpen('tagging') ? 'true' : 'false'"
        aria-controls="advanced-tagging-panel"
        @click="toggleSection('tagging')"
      >
        <span class="inline-flex items-center gap-1.5">
          <Tags class="h-4 w-4 text-sky-700" aria-hidden="true" />
          Photo Tags And Order
        </span>
        <span class="fd-kicker text-[10px]">{{ isOpen("tagging") ? "Hide" : "Show" }}</span>
      </button>
      <div v-if="isOpen('tagging')" id="advanced-tagging-panel" class="grid gap-2">
        <PhotoTagManagerSection
          v-if="props.taggedPhotos.length > 0"
          :tagged-photos="props.taggedPhotos"
          :available-photo-tags="props.availablePhotoTags"
          @photo-tag-update="$emit('photo-tag-update', $event)"
          @photo-tag-batch-update="$emit('photo-tag-batch-update', $event)"
          @photo-reorder="$emit('photo-reorder', $event)"
        />
        <p v-else class="fd-text-muted text-[12px] leading-5">Add photos in Step 1 to edit order and tags.</p>
      </div>
    </section>

    <section class="fd-subtle-card grid gap-2 rounded-lg p-2.5">
      <button
        type="button"
        class="fd-accordion-toggle flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[14px] font-semibold"
        :aria-expanded="isOpen('settings') ? 'true' : 'false'"
        aria-controls="advanced-settings-panel"
        @click="toggleSection('settings')"
      >
        <span class="inline-flex items-center gap-1.5">
          <FolderSync class="h-4 w-4 text-sky-700" aria-hidden="true" />
          Settings Transfer
        </span>
        <span class="fd-kicker text-[10px]">{{ isOpen("settings") ? "Hide" : "Show" }}</span>
      </button>
      <div v-if="isOpen('settings')" id="advanced-settings-panel" class="fd-callout-muted grid gap-2 rounded-md p-2.5">
        <div class="grid grid-cols-4 gap-2 max-[680px]:grid-cols-1">
          <BaseButton tone="subtle" @click="$emit('export-settings')">Export JSON</BaseButton>
          <label class="fd-text-body grid gap-1 text-[12px]" for="shareLinkExpiry">
            <span>Share Link Expiry</span>
            <select
              id="shareLinkExpiry"
              v-model.number="shareExpirySeconds"
              class="fd-input w-full rounded-md px-2 py-1.5 text-xs"
            >
              <option
                v-for="option in shareExpiryOptions"
                :key="`share-expiry-${option.valueSeconds}`"
                :value="option.valueSeconds"
              >
                {{ option.label }}
              </option>
            </select>
          </label>
          <BaseButton
            tone="subtle"
            @click="$emit('share-settings-link', { expiresInSeconds: shareExpirySeconds })"
          >
            Copy Share Link
          </BaseButton>
          <label class="fd-text-body grid gap-1 text-[12px]">
            <span>Import JSON</span>
            <input
              type="file"
              accept="application/json,.json"
              class="fd-file-input w-full rounded-md px-2 py-1.5 text-xs"
              @change="$emit('import-settings', $event)"
            />
          </label>
        </div>
      </div>
    </section>

    <section class="fd-subtle-card grid gap-2 rounded-lg p-2.5">
      <button
        type="button"
        class="fd-accordion-toggle flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[14px] font-semibold"
        :aria-expanded="isOpen('history') ? 'true' : 'false'"
        aria-controls="advanced-history-panel"
        @click="toggleSection('history')"
      >
        <span class="inline-flex items-center gap-1.5">
          <History class="h-4 w-4 text-sky-700" aria-hidden="true" />
          Session History
        </span>
        <span class="fd-kicker text-[10px]">{{ isOpen("history") ? "Hide" : "Show" }}</span>
      </button>
      <div v-if="isOpen('history')" id="advanced-history-panel">
        <SessionHistorySection
          :session-history="props.sessionHistory"
          :run-snapshots="props.runSnapshots"
          @clear-history="$emit('clear-history')"
          @rerun-history="$emit('rerun-history', $event)"
          @save-history-snapshot="$emit('save-history-snapshot', $event)"
          @restore-run-snapshot="$emit('restore-run-snapshot', $event)"
          @delete-run-snapshot="$emit('delete-run-snapshot', $event)"
        />
      </div>
    </section>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { FolderSync, History, SlidersHorizontal, Tags } from "lucide-vue-next";
import {
  DEFAULT_SETTINGS_SHARE_EXPIRY_SECONDS,
  SETTINGS_SHARE_EXPIRY_OPTIONS
} from "../../composables/figureSession/settingsTransfer";
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
  },
  runSnapshots: {
    type: Array,
    required: true
  }
});

defineEmits([
  "photo-tag-update",
  "photo-tag-batch-update",
  "photo-reorder",
  "export-settings",
  "share-settings-link",
  "import-settings",
  "clear-history",
  "rerun-history",
  "save-history-snapshot",
  "restore-run-snapshot",
  "delete-run-snapshot"
]);

const openSections = ref(new Set(["tagging", "settings"]));
const shareExpiryOptions = SETTINGS_SHARE_EXPIRY_OPTIONS;
const shareExpirySeconds = ref(DEFAULT_SETTINGS_SHARE_EXPIRY_SECONDS);

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
