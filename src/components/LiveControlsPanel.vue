<template>
  <div class="grid grid-cols-2 gap-1.5">
    <BaseButton compact :disabled="!isRunning" @click="$emit('toggle-pause')">
      {{ pauseLabel }}
    </BaseButton>
    <BaseButton compact :disabled="!isRunning" tone="subtle" @click="$emit('next')">Next</BaseButton>
    <BaseButton compact :disabled="!hasSourcePhotos" tone="subtle" @click="$emit('new-set')">
      New Set
    </BaseButton>
    <BaseButton compact tone="danger" @click="$emit('end')">End</BaseButton>
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
import BaseButton from "./BaseButton.vue";
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
