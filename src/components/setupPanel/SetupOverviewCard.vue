<template>
  <div class="grid gap-2.5">
    <section class="fd-hero-surface relative grid gap-3.5 overflow-hidden rounded-2xl p-5 max-[720px]:p-4">
      <div class="flex items-center justify-between gap-2">
        <div class="grid gap-1">
          <p class="fd-kicker">Studio Setup</p>
          <p class="fd-text-strong text-[15px] leading-6 font-semibold">{{ landingSummary }}</p>
        </div>
        <p
          class="fd-callout-muted fd-text-body rounded-full px-2.5 py-1 text-xs font-semibold"
        >
          {{ progressLabel }}
        </p>
      </div>
      <div class="h-1.5 overflow-hidden rounded-full bg-[rgb(var(--fd-surface-muted)/0.84)]">
        <div
          class="h-full rounded-full bg-gradient-to-r from-sky-300 to-orange-300 transition-[width] duration-200"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <div class="fd-text-muted flex flex-wrap items-center gap-2 text-[11px]">
        <span class="fd-chip rounded-full px-2.5 py-1">Structured setup</span>
        <span class="fd-chip rounded-full px-2.5 py-1">Curated warmups</span>
        <span class="fd-chip rounded-full px-2.5 py-1">Focused finals</span>
      </div>
      <div class="grid gap-2.5">
        <BaseButton tone="subtle" @click="$emit('open-wizard')">
          {{ wizardActionLabel }}
        </BaseButton>
        <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
          <BaseButton :disabled="!canStartSession" @click="$emit('start-session')">
            {{ startActionLabel }}
          </BaseButton>
          <BaseButton :disabled="!hasSourcePhotos" tone="subtle" @click="$emit('new-random-set')">
            {{ regenerateActionLabel }}
          </BaseButton>
        </div>
      </div>
    </section>

    <div class="fd-callout grid gap-1.5 rounded-xl px-3.5 py-3">
      <p class="fd-text-body text-sm" role="status" aria-live="polite">{{ statusMessage }}</p>
      <p v-if="uploadNotice" class="fd-text-body text-sm">{{ uploadNotice }}</p>
      <p class="fd-text-caption text-xs" aria-live="polite">{{ settingsSaveStatusText }}</p>
      <p class="fd-text-caption text-xs">Shortcuts: Space pause/resume, Right Arrow next, Esc end.</p>
    </div>
  </div>
</template>

<script setup>
import BaseButton from "../BaseButton.vue";

defineProps({
  landingSummary: {
    type: String,
    required: true
  },
  progressLabel: {
    type: String,
    required: true
  },
  progressPercent: {
    type: Number,
    required: true
  },
  wizardActionLabel: {
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
  canStartSession: {
    type: Boolean,
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
  settingsSaveStatusText: {
    type: String,
    required: true
  },
  uploadNotice: {
    type: String,
    default: ""
  }
});

defineEmits(["open-wizard", "start-session", "new-random-set"]);
</script>
