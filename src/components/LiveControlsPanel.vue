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

  <section class="grid gap-1 rounded-md border border-slate-600/60 bg-slate-900/60 p-2">
    <p class="text-xs font-medium text-slate-200">Stage View</p>
    <div class="grid grid-cols-1 gap-1">
      <BaseButton compact :tone="mirrorLiveView ? 'primary' : 'subtle'" @click="$emit('toggle-mirror-live-view')">
        {{ mirrorLiveView ? "Mirror: On" : "Mirror: Off" }}
      </BaseButton>
      <BaseButton compact :tone="grayscaleLiveView ? 'primary' : 'subtle'" @click="$emit('toggle-grayscale-live-view')">
        {{ grayscaleLiveView ? "Grayscale: On" : "Grayscale: Off" }}
      </BaseButton>
      <BaseButton compact :tone="hideLiveOverlay ? 'primary' : 'subtle'" @click="$emit('toggle-hide-live-overlay')">
        {{ hideLiveOverlay ? "Timer Overlay: Hidden" : "Timer Overlay: Visible" }}
      </BaseButton>
    </div>
  </section>
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
  mirrorLiveView: {
    type: Boolean,
    required: true
  },
  grayscaleLiveView: {
    type: Boolean,
    required: true
  },
  hideLiveOverlay: {
    type: Boolean,
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

defineEmits([
  "duration-input",
  "duration-change",
  "toggle-mirror-live-view",
  "toggle-grayscale-live-view",
  "toggle-hide-live-overlay",
  "toggle-pause",
  "next",
  "new-set",
  "end"
]);
</script>
