<template>
  <div class="grid gap-1.5">
    <section class="fd-hero-surface relative grid gap-3 overflow-hidden rounded-xl p-4">
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -right-10 top-0 h-28 w-28 rounded-full bg-sky-300/24 blur-3xl"
      />
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-emerald-300/24 blur-3xl"
      />
      <div class="flex items-center justify-between gap-2">
        <div class="grid gap-0.5">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Setup Overview</p>
          <p class="text-[15px] font-semibold text-stone-800">{{ landingSummary }}</p>
        </div>
        <p
          class="rounded-full border border-amber-300/70 bg-orange-100/60 px-2.5 py-0.5 text-xs font-medium text-stone-700"
        >
          {{ progressLabel }}
        </p>
      </div>
      <div class="h-1.5 overflow-hidden rounded-full bg-amber-100/80">
        <div
          class="h-full rounded-full bg-gradient-to-r from-sky-300 via-emerald-300 to-orange-300 transition-[width] duration-200"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <div class="flex flex-wrap items-center gap-2 text-[11px] text-stone-700">
        <span class="rounded-full border border-amber-300/70 bg-sky-100/72 px-2 py-0.5">Step-based setup</span>
        <span class="rounded-full border border-emerald-300/35 bg-emerald-100/70 px-2 py-0.5">Fast randomizer</span>
        <span class="rounded-full border border-amber-300/35 bg-orange-100/70 px-2 py-0.5">Live fullscreen</span>
      </div>
      <div class="grid gap-2">
        <BaseButton @click="$emit('open-wizard')">
          {{ wizardActionLabel }}
        </BaseButton>
        <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
          <BaseButton :disabled="!canStartSession" tone="subtle" @click="$emit('start-session')">
            {{ startActionLabel }}
          </BaseButton>
          <BaseButton :disabled="!hasSourcePhotos" tone="subtle" @click="$emit('new-random-set')">
            {{ regenerateActionLabel }}
          </BaseButton>
        </div>
      </div>
    </section>

    <div class="grid gap-1.5 rounded-lg border border-amber-200/85 bg-white/68 px-3 py-2.5">
      <p class="text-sm text-stone-700" role="status" aria-live="polite">{{ statusMessage }}</p>
      <p v-if="uploadNotice" class="text-sm text-stone-700">{{ uploadNotice }}</p>
      <p class="text-xs text-stone-500" aria-live="polite">{{ settingsSaveStatusText }}</p>
      <p class="text-xs text-stone-500">Shortcuts: Space pause/resume, Right Arrow next, Esc end.</p>
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
