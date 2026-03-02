<template>
  <section class="fd-callout grid gap-3.5 rounded-xl p-4">
    <div class="grid gap-1">
      <p class="fd-text-strong inline-flex items-center gap-2 text-[15px] font-semibold">
        <Timer class="h-4 w-4 text-lime-700" aria-hidden="true" />
        Step 2: Configure session
      </p>
      <p class="fd-text-muted text-[13px] leading-5">
        Choose quick practice or class mode, then set timing and plan options.
      </p>
    </div>

    <div class="grid gap-3.5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.95fr)] xl:items-start">
      <div class="grid gap-3">
        <div class="grid gap-1.5">
          <p class="fd-kicker">Session Mode</p>
          <div class="fd-segmented max-w-[420px]" role="group" aria-label="Session mode selection">
            <button
              type="button"
              class="fd-segmented-option"
              :class="{ 'is-active': sessionMode === 'class' }"
              :aria-pressed="sessionMode === 'class' ? 'true' : 'false'"
              @click="$emit('session-mode-change', 'class')"
            >
              Life Class Wizard
            </button>
            <button
              type="button"
              class="fd-segmented-option"
              :class="{ 'is-active': sessionMode === 'quick' }"
              :aria-pressed="sessionMode === 'quick' ? 'true' : 'false'"
              @click="$emit('session-mode-change', 'quick')"
            >
              Quick Session
            </button>
          </div>
        </div>

        <section
          v-if="sessionMode === 'quick'"
          class="fd-nested-surface grid gap-2.5 rounded-lg p-3"
        >
          <div class="grid gap-1">
            <p class="fd-text-strong text-[15px] font-semibold">Quick Session</p>
            <p class="fd-text-muted text-[13px] leading-5">Set one timer that applies to each photo in the run.</p>
          </div>
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
          class="fd-nested-surface grid gap-2.5 rounded-lg p-3"
        >
          <div class="grid gap-1">
            <p class="fd-text-strong text-[15px] font-semibold">Life Drawing Class</p>
            <p class="fd-text-muted text-[13px] leading-5">
              Open the class wizard to tune block timing, photo order, and reusable templates.
            </p>
          </div>
          <BaseButton tone="subtle" @click="$emit('open-class-dialog')">Edit Class Plan</BaseButton>
        </section>
      </div>

      <aside class="grid gap-2.5 xl:sticky xl:top-2">
        <div class="fd-callout-muted fd-text-body grid gap-1 rounded-lg px-3 py-2.5 text-[13px] leading-5">
          <template v-if="sessionMode === 'quick'">
            <p>
              Quick timer:
              <span class="fd-text-strong font-semibold">{{ quickDurationSeconds }}s</span>
              per photo.
            </p>
          </template>
          <template v-else>
            <p>
              Plan total:
              <span class="fd-text-strong font-semibold">{{ classTotalMinutesText }}</span>
              across {{ classPoseCount }} poses.
            </p>
            <p class="fd-text-muted">Preset target: {{ classTargetMinutes }} minutes ({{ classDeltaText }}).</p>
          </template>
        </div>

        <SessionPreviewSection
          :preview-items="sessionPreviewItems"
          :preview-summary-text="sessionPreviewSummaryText"
        />

        <div class="fd-callout grid gap-2 rounded-lg p-2.5">
          <BaseButton :disabled="!canStartSession" @click="$emit('start-session')">
            {{ startActionLabel }}
          </BaseButton>
          <BaseButton :disabled="!hasSourcePhotos" tone="subtle" @click="$emit('new-random-set')">
            {{ regenerateActionLabel }}
          </BaseButton>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { Timer } from "lucide-vue-next";
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

const quickDurationSeconds = computed(() => {
  const parsedValue = Number.parseInt(String(props.durationSeconds), 10);
  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return Math.max(0, parsedValue);
});
</script>
