<template>
  <label class="grid gap-1.5 text-sm text-slate-200" for="photoInput">
    <span class="font-medium">Upload Photos</span>
    <input
      id="photoInput"
      type="file"
      :accept="fileInputAccept"
      multiple
      class="w-full rounded-md border border-slate-600 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 file:mr-2 file:cursor-pointer file:rounded file:border file:border-slate-600 file:bg-slate-700 file:px-2 file:py-1 file:text-sm file:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      @change="onPhotosSelected"
    />
  </label>

  <DurationInput
    id="durationInput"
    label="Seconds Per Photo"
    :value="durationSeconds"
    @update="$emit('duration-input', $event)"
    @commit="$emit('duration-change')"
  />

  <div class="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2">
    <BaseButton :disabled="!hasSourcePhotos" @click="$emit('start-session')">
      Start Session
    </BaseButton>
    <BaseButton :disabled="!hasSourcePhotos" tone="subtle" @click="$emit('new-random-set')">
      New Random Set
    </BaseButton>
  </div>

  <p class="text-sm text-slate-400" role="status" aria-live="polite">{{ statusMessage }}</p>
  <p v-if="uploadNotice" class="text-sm text-slate-300">{{ uploadNotice }}</p>
  <p class="text-sm text-slate-500">Shortcuts: Space pause/resume, Right Arrow next, Esc end.</p>
</template>

<script setup>
import BaseButton from "./BaseButton.vue";
import DurationInput from "./DurationInput.vue";

defineProps({
  fileInputAccept: {
    type: String,
    required: true
  },
  durationSeconds: {
    type: [Number, String],
    required: true
  },
  hasSourcePhotos: {
    type: Boolean,
    required: true
  },
  statusMessage: {
    type: String,
    required: true
  },
  uploadNotice: {
    type: String,
    default: ""
  }
});

const emit = defineEmits([
  "photos-selected",
  "duration-input",
  "duration-change",
  "start-session",
  "new-random-set"
]);

function onPhotosSelected(event) {
  emit("photos-selected", event.target?.files || []);
}
</script>
