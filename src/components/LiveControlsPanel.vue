<template>
  <div class="grid grid-cols-2 gap-1.5">
    <BaseButton compact :disabled="!isRunning && !isPaused" @click="$emit('toggle-pause')">
      {{ pauseLabel }}
    </BaseButton>
    <BaseButton compact :disabled="!isRunning" tone="subtle" @click="$emit('next')">Next</BaseButton>
    <BaseButton compact :disabled="!hasSourcePhotos" tone="subtle" @click="$emit('new-set')">
      {{ restartLabel }}
    </BaseButton>
    <BaseButton compact tone="danger" @click="$emit('end')">End</BaseButton>
  </div>

  <DurationInput
    v-if="sessionMode === 'quick'"
    id="durationInputCompact"
    label="Sec / Photo"
    :value="durationSeconds"
    :compact="true"
    @update="$emit('duration-input', $event)"
    @commit="$emit('duration-change')"
  />
</template>

<script setup>
import BaseButton from "./BaseButton.vue";
import DurationInput from "./DurationInput.vue";

defineProps({
  sessionMode: {
    type: String,
    required: true
  },
  durationSeconds: {
    type: [Number, String],
    required: true
  },
  isRunning: {
    type: Boolean,
    required: true
  },
  isPaused: {
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
  },
  restartLabel: {
    type: String,
    required: true
  }
});

defineEmits(["duration-input", "duration-change", "toggle-pause", "next", "new-set", "end"]);
</script>
