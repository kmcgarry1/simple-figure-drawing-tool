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

  <section class="grid gap-1.5 rounded-md border border-slate-600/60 bg-slate-900/60 p-2">
    <div class="flex items-center justify-between gap-2">
      <p class="text-xs font-medium text-slate-200">Audio Cues</p>
      <BaseButton compact tone="subtle" @click="$emit('audio-mute-toggle')">
        {{ audioMuted ? "Unmute" : "Mute" }}
      </BaseButton>
    </div>

    <label class="grid gap-1 text-xs text-slate-300" for="audioVolumeRange">
      <span>Volume: {{ audioVolumePercent }}%</span>
      <input
        id="audioVolumeRange"
        type="range"
        min="0"
        max="100"
        step="1"
        :value="audioVolumePercent"
        class="accent-sky-400"
        @input="$emit('audio-volume-input', $event.target.value)"
      />
    </label>
    <p class="text-[11px] text-slate-400">Includes 3-2-1 countdown and pose-end chime.</p>
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
  audioMuted: {
    type: Boolean,
    required: true
  },
  audioVolumePercent: {
    type: Number,
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
  "audio-volume-input",
  "audio-mute-toggle",
  "toggle-pause",
  "next",
  "new-set",
  "end"
]);
</script>
