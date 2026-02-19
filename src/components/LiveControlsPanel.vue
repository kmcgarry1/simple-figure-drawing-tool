<template>
  <div class="button-row compact-row">
    <button type="button" :disabled="!isRunning" @click="$emit('toggle-pause')">{{ pauseLabel }}</button>
    <button type="button" :disabled="!isRunning" @click="$emit('next')">Next</button>
    <button type="button" :disabled="!hasSourcePhotos" @click="$emit('new-set')">New Set</button>
    <button type="button" @click="$emit('end')">End</button>
  </div>

  <DurationInput
    id="durationInputCompact"
    label="Sec / Photo"
    :value="durationSeconds"
    :compact="true"
    @update="$emit('duration-input', $event)"
    @commit="$emit('duration-change')"
  />
</template>

<script setup>
import DurationInput from "./DurationInput.vue";

defineProps({
  durationSeconds: {
    type: [Number, String],
    required: true
  },
  isRunning: {
    type: Boolean,
    required: true
  },
  hasSourcePhotos: {
    type: Boolean,
    required: true
  },
  pauseLabel: {
    type: String,
    required: true
  }
});

defineEmits(["duration-input", "duration-change", "toggle-pause", "next", "new-set", "end"]);
</script>
