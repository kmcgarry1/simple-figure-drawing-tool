<template>
  <div class="grid gap-3">
    <section class="fd-hero-surface fd-studio-board relative grid gap-4 overflow-hidden rounded-[1.35rem] p-5 max-[720px]:p-4">
      <div
        aria-hidden="true"
        class="fd-soft-sheen pointer-events-none absolute inset-x-0 -top-16 h-40"
      />
      <div class="relative grid gap-3">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="grid gap-1">
            <p class="fd-kicker">Session Setup</p>
            <p class="fd-text-strong text-[15px] font-semibold leading-6">{{ landingSummary }}</p>
          </div>
          <p class="fd-callout-muted fd-text-body rounded-full px-2.5 py-1 text-xs font-semibold">
            {{ progressLabel }}
          </p>
        </div>

        <div class="grid gap-1.5">
          <div class="h-2 overflow-hidden rounded-full bg-[rgb(var(--fd-surface-muted)/0.84)]">
            <div
              class="fd-progress-fill h-full rounded-full transition-[width] duration-300"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
          <p class="fd-text-caption text-[11px]">Progress: {{ progressPercent }}%</p>
        </div>

        <div class="fd-text-muted flex flex-wrap items-center gap-2 text-[11px]">
          <span class="fd-chip fd-chip-art rounded-full px-2.5 py-1">Quick To Configure</span>
          <span class="fd-chip fd-chip-art rounded-full px-2.5 py-1">Reusable Presets</span>
          <span class="fd-chip fd-chip-art rounded-full px-2.5 py-1">Live Control Ready</span>
        </div>

        <p class="fd-studio-note text-[11px]">
          Studio tip: mix class templates with tag filters to create themed gesture sets.
        </p>
      </div>

      <div class="relative grid gap-2.5">
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

    <div class="fd-callout fd-status-strip grid gap-1.5 rounded-2xl px-3.5 py-3">
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
