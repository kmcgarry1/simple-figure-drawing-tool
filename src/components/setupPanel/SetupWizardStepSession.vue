<template>
  <section class="grid gap-3 rounded-lg border border-amber-200/80 bg-white/58 p-3">
    <div class="grid gap-1">
      <p class="text-sm font-semibold text-stone-800">Step 2: Configure session</p>
      <p class="text-xs text-stone-500">
        Choose quick practice or class mode, then set timing and plan options.
      </p>
    </div>

    <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
      <BaseButton :tone="modeTone('class')" @click="$emit('session-mode-change', 'class')">
        Life Class Wizard
      </BaseButton>
      <BaseButton :tone="modeTone('quick')" @click="$emit('session-mode-change', 'quick')">
        Quick Session
      </BaseButton>
    </div>

    <section
      v-if="sessionMode === 'quick'"
      class="grid gap-2 rounded-md border border-amber-200/80 bg-white/64 p-2.5"
    >
      <p class="text-sm font-semibold text-stone-800">2. Quick Session</p>
      <DurationInput
        id="durationInput"
        label="Seconds Per Photo"
        :value="durationSeconds"
        @update="$emit('duration-input', $event)"
        @commit="$emit('duration-change')"
      />
    </section>

    <section
      v-else
      class="grid gap-2 rounded-md border border-amber-200/80 bg-white/64 p-2.5"
    >
      <p class="text-sm font-semibold text-stone-800">2. Life Drawing Class Wizard</p>
      <div
        class="grid gap-1 rounded-md border border-amber-200/80 bg-white/60 px-2.5 py-2 text-sm text-stone-600"
      >
        <p>
          Plan total:
          <span class="font-semibold text-stone-800">{{ classTotalMinutesText }}</span>
          across {{ classPoseCount }} poses.
        </p>
        <p>Preset target: {{ classTargetMinutes }} minutes ({{ classDeltaText }}).</p>
      </div>
      <BaseButton tone="subtle" @click="$emit('open-class-dialog')">Edit Class Plan</BaseButton>
    </section>

    <SessionPreviewSection
      :preview-items="sessionPreviewItems"
      :preview-summary-text="sessionPreviewSummaryText"
    />

    <div class="grid gap-2">
      <BaseButton :disabled="!canStartSession" @click="$emit('start-session')">
        {{ startActionLabel }}
      </BaseButton>
      <BaseButton :disabled="!hasSourcePhotos" tone="subtle" @click="$emit('new-random-set')">
        {{ regenerateActionLabel }}
      </BaseButton>
    </div>
  </section>
</template>

<script setup>
import BaseButton from "../BaseButton.vue";
import DurationInput from "../DurationInput.vue";
import SessionPreviewSection from "../SessionPreviewSection.vue";

const props = defineProps({
  sessionMode: {
    type: String,
    required: true
  },
  durationSeconds: {
    type: [Number, String],
    required: true
  },
  classTargetMinutes: {
    type: Number,
    required: true
  },
  classPoseCount: {
    type: Number,
    required: true
  },
  classTotalMinutesText: {
    type: String,
    required: true
  },
  classDeltaText: {
    type: String,
    required: true
  },
  startActionLabel: {
    type: String,
    required: true
  },
  regenerateActionLabel: {
    type: String,
    required: true
  },
  hasSourcePhotos: {
    type: Boolean,
    required: true
  },
  canStartSession: {
    type: Boolean,
    required: true
  },
  sessionPreviewItems: {
    type: Array,
    required: true
  },
  sessionPreviewSummaryText: {
    type: String,
    required: true
  }
});

defineEmits([
  "session-mode-change",
  "duration-input",
  "duration-change",
  "start-session",
  "new-random-set",
  "open-class-dialog"
]);

function modeTone(mode) {
  return props.sessionMode === mode ? "primary" : "subtle";
}
</script>
