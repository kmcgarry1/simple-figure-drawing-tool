<template>
  <AppSheet
    :is-open="isOpen"
    title="Manage library"
    description="Edit photo order and tags, then export or share the current setup."
    eyebrow="Library"
    placement="right"
    size="wide"
    @close="$emit('close')"
  >
    <div class="grid gap-4">
      <section class="fd-callout grid gap-2 rounded-2xl p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="grid gap-1">
            <p class="fd-text-strong text-sm font-semibold">
              {{ taggedPhotos.length }} photo{{ taggedPhotos.length === 1 ? "" : "s" }} loaded
            </p>
            <p class="fd-text-muted text-sm">{{ settingsSaveStatusText }}</p>
          </div>
          <span class="fd-chip rounded-full px-3 py-1 text-xs font-semibold">
            {{ availablePhotoTags.length }} tag{{ availablePhotoTags.length === 1 ? "" : "s" }}
          </span>
        </div>
      </section>

      <PhotoTagManagerSection
        :tagged-photos="taggedPhotos"
        :available-photo-tags="availablePhotoTags"
        @photo-tag-update="$emit('photo-tag-update', $event)"
        @photo-tag-batch-update="$emit('photo-tag-batch-update', $event)"
        @photo-reorder="$emit('photo-reorder', $event)"
      />

      <section class="fd-card grid gap-3 rounded-2xl p-4">
        <div class="grid gap-1">
          <p class="fd-section-label">Transfer</p>
          <p class="fd-text-strong text-base font-semibold">Move this setup between devices</p>
          <p class="fd-text-muted text-sm">
            Export JSON, generate a share link, or import a saved setup without changing the payload format.
          </p>
        </div>

        <div class="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto_auto] lg:items-end">
          <BaseButton tone="subtle" @click="$emit('export-settings')">
            <Download class="fd-inline-icon-sm" aria-hidden="true" />
            Export JSON
          </BaseButton>

          <label class="grid gap-1 text-sm" for="libraryShareExpiry">
            <span class="fd-text-muted">Share link expiry</span>
            <select
              id="libraryShareExpiry"
              v-model.number="shareExpirySeconds"
              class="fd-input w-full rounded-xl px-3 py-2"
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

          <BaseButton tone="subtle" @click="$emit('share-settings-link', { expiresInSeconds: shareExpirySeconds })">
            <Link class="fd-inline-icon-sm" aria-hidden="true" />
            Copy Share Link
          </BaseButton>

          <label class="grid gap-1 text-sm">
            <span class="fd-text-muted">Import JSON</span>
            <input
              type="file"
              accept="application/json,.json"
              class="fd-file-input w-full rounded-xl px-3 py-2"
              @change="$emit('import-settings', $event)"
            />
          </label>
        </div>
      </section>
    </div>
  </AppSheet>
</template>

<script setup>
import { ref } from "vue";
import { Download, Link } from "lucide-vue-next";
import {
  DEFAULT_SETTINGS_SHARE_EXPIRY_SECONDS,
  SETTINGS_SHARE_EXPIRY_OPTIONS
} from "../composables/figureSession/settingsTransfer";
import BaseButton from "./BaseButton.vue";
import AppSheet from "./AppSheet.vue";
import PhotoTagManagerSection from "./PhotoTagManagerSection.vue";

defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  taggedPhotos: {
    type: Array,
    required: true
  },
  availablePhotoTags: {
    type: Array,
    required: true
  },
  settingsSaveStatusText: {
    type: String,
    required: true
  }
});

defineEmits([
  "close",
  "photo-tag-update",
  "photo-tag-batch-update",
  "photo-reorder",
  "export-settings",
  "share-settings-link",
  "import-settings"
]);

const shareExpiryOptions = SETTINGS_SHARE_EXPIRY_OPTIONS;
const shareExpirySeconds = ref(DEFAULT_SETTINGS_SHARE_EXPIRY_SECONDS);
</script>
