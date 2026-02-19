<template>
  <label class="upload-label" for="photoInput">
    <span>Upload Photos</span>
    <input id="photoInput" type="file" :accept="fileInputAccept" multiple @change="onPhotosSelected" />
  </label>

  <DurationInput
    id="durationInput"
    label="Seconds Per Photo"
    :value="durationSeconds"
    @update="$emit('duration-input', $event)"
    @commit="$emit('duration-change')"
  />

  <div class="button-row">
    <button type="button" :disabled="!hasSourcePhotos" @click="$emit('start-session')">
      Start Session
    </button>
    <button type="button" :disabled="!hasSourcePhotos" @click="$emit('new-random-set')">
      New Random Set
    </button>
  </div>

  <p class="status" role="status" aria-live="polite">{{ statusMessage }}</p>
  <p v-if="uploadNotice" class="notice">{{ uploadNotice }}</p>
  <p class="hint">Shortcuts: Space pause/resume, Right Arrow next, Esc end.</p>
</template>

<script setup>
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
