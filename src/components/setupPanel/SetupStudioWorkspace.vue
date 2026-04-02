<template>
  <div class="grid gap-4">
    <section class="fd-studio-workspace surface-panel relative overflow-hidden rounded-[1.8rem] px-5 py-5 max-[720px]:rounded-[1.2rem] max-[720px]:px-4 max-[720px]:py-4">
      <div class="fd-soft-sheen pointer-events-none absolute inset-x-0 -top-20 h-44" aria-hidden="true" />

      <div class="relative grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-start">
        <div class="grid gap-3">
          <div class="grid gap-1.5">
            <p class="fd-section-label">Prep Workspace</p>
            <h2 class="fd-title-gradient text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-tight">
              Prepare the session in one place.
            </h2>
            <p class="fd-text-muted max-w-[58ch] text-[14px] leading-6">
              Load references, choose the session model, and refine supporting tools without bouncing between separate setup surfaces.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-[11px] font-medium">
            <span class="fd-chip fd-chip-art rounded-full px-2.5 py-1">Source Library</span>
            <span class="fd-chip fd-chip-art rounded-full px-2.5 py-1">Session Planning</span>
            <span class="fd-chip fd-chip-art rounded-full px-2.5 py-1">Advanced Tools</span>
          </div>
        </div>

        <aside class="fd-callout fd-context-readiness grid gap-3 rounded-[1.35rem] p-4">
          <div class="flex items-center justify-between gap-2">
            <div class="grid gap-1">
              <p class="fd-section-label">Readiness</p>
              <p class="fd-text-strong text-sm font-semibold">{{ landingSummary }}</p>
            </div>
            <span class="fd-chip rounded-full px-2 py-0.5 text-[11px] font-semibold">
              {{ progressLabel }}
            </span>
          </div>

          <div class="grid gap-1.5">
            <div class="h-1.5 overflow-hidden rounded-full bg-[rgb(var(--fd-surface-muted)/0.84)]">
              <div
                class="fd-progress-fill h-full rounded-full transition-[width] duration-300"
                :style="{ width: `${progressPercent}%` }"
              />
            </div>
            <p class="fd-text-caption text-[11px]">{{ progressPercent }}% setup complete</p>
          </div>

          <div class="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <article class="fd-subtle-card grid gap-0.5 rounded-xl px-3 py-2.5">
              <p class="fd-kicker">Photos</p>
              <p class="fd-text-strong text-sm font-semibold">{{ taggedPhotos.length }}</p>
            </article>
            <article class="fd-subtle-card grid gap-0.5 rounded-xl px-3 py-2.5">
              <p class="fd-kicker">Mode</p>
              <p class="fd-text-strong text-sm font-semibold">{{ sessionModeLabel }}</p>
            </article>
            <article class="fd-subtle-card grid gap-0.5 rounded-xl px-3 py-2.5">
              <p class="fd-kicker">Plan</p>
              <p class="fd-text-strong text-sm font-semibold">{{ planStatusLabel }}</p>
            </article>
          </div>

          <div class="grid gap-2">
            <BaseButton :disabled="!canStartSession" @click="$emit('start-session')">
              {{ startActionLabel }}
            </BaseButton>
            <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
              <BaseButton :disabled="!hasSourcePhotos" tone="subtle" @click="$emit('new-random-set')">
                {{ regenerateActionLabel }}
              </BaseButton>
              <BaseButton tone="subtle" @click="$emit('open-wizard')">
                {{ wizardActionLabel }}
              </BaseButton>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <section class="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:items-start">
      <div class="grid gap-4">
        <section class="surface-panel grid gap-3 rounded-[1.45rem] p-4 max-[720px]:rounded-xl max-[720px]:p-3.5">
          <div class="grid gap-1">
            <p class="fd-section-label">Step 1</p>
            <h3 class="fd-text-strong text-base font-semibold">Build the source pool</h3>
            <p class="fd-text-muted text-[13px] leading-5">
              Start with references first so the rest of the decisions happen with immediate feedback.
            </p>
          </div>

          <SetupWizardStepPhotos
            :file-input-accept="fileInputAccept"
            :tagged-photos="taggedPhotos"
            @photos-selected="$emit('photos-selected', $event)"
          />
        </section>

        <section class="surface-panel grid gap-3 rounded-[1.45rem] p-4 max-[720px]:rounded-xl max-[720px]:p-3.5">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="grid gap-1">
              <p class="fd-section-label">Step 2</p>
              <h3 class="fd-text-strong text-base font-semibold">Configure the run</h3>
              <p class="fd-text-muted text-[13px] leading-5">
                Choose quick practice or class mode, then tune the session while keeping the preview visible.
              </p>
            </div>
            <BaseButton v-if="sessionMode === 'class'" compact tone="subtle" @click="$emit('open-class-dialog')">
              Edit Class Plan
            </BaseButton>
          </div>

          <SetupWizardStepSession
            :session-mode="sessionMode"
            :duration-seconds="durationSeconds"
            :class-target-minutes="classTargetMinutes"
            :class-pose-count="classPoseCount"
            :class-total-minutes-text="classTotalMinutesText"
            :class-delta-text="classDeltaText"
            :start-action-label="startActionLabel"
            :regenerate-action-label="regenerateActionLabel"
            :has-source-photos="hasSourcePhotos"
            :can-start-session="canStartSession"
            :session-preview-items="sessionPreviewItems"
            :session-preview-summary-text="sessionPreviewSummaryText"
            @session-mode-change="$emit('session-mode-change', $event)"
            @duration-input="$emit('duration-input', $event)"
            @duration-change="$emit('duration-change')"
            @start-session="$emit('start-session')"
            @new-random-set="$emit('new-random-set')"
            @open-class-dialog="$emit('open-class-dialog')"
          />
        </section>
      </div>

      <div class="grid gap-4">
        <section class="surface-panel grid gap-3 rounded-[1.45rem] p-4 max-[720px]:rounded-xl max-[720px]:p-3.5">
          <div class="grid gap-1">
            <p class="fd-section-label">Step 3</p>
            <h3 class="fd-text-strong text-base font-semibold">Refine and reuse</h3>
            <p class="fd-text-muted text-[13px] leading-5">
              Keep photo tagging, settings transfer, history, and snapshots within the same prep view.
            </p>
          </div>

          <SetupWizardStepAdvanced
            :tagged-photos="taggedPhotos"
            :available-photo-tags="availablePhotoTags"
            :session-history="sessionHistory"
            :run-snapshots="runSnapshots"
            @photo-tag-update="$emit('photo-tag-update', $event)"
            @photo-tag-batch-update="$emit('photo-tag-batch-update', $event)"
            @photo-reorder="$emit('photo-reorder', $event)"
            @export-settings="$emit('export-settings')"
            @share-settings-link="$emit('share-settings-link', $event)"
            @import-settings="$emit('import-settings', $event)"
            @clear-history="$emit('clear-history')"
            @rerun-history="$emit('rerun-history', $event)"
            @save-history-snapshot="$emit('save-history-snapshot', $event)"
            @restore-run-snapshot="$emit('restore-run-snapshot', $event)"
            @delete-run-snapshot="$emit('delete-run-snapshot', $event)"
          />
        </section>

        <section class="fd-callout grid gap-1.5 rounded-[1.45rem] px-4 py-3.5">
          <p class="fd-text-body text-sm" role="status" aria-live="polite">{{ statusMessage }}</p>
          <p v-if="uploadNotice" class="fd-text-body text-sm">{{ uploadNotice }}</p>
          <p class="fd-text-caption text-xs" aria-live="polite">{{ settingsSaveStatusText }}</p>
          <p class="fd-text-caption text-xs">Shortcuts: Space pause/resume, Right Arrow next, Esc end.</p>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue";
import BaseButton from "../BaseButton.vue";
import SetupWizardStepAdvanced from "./SetupWizardStepAdvanced.vue";
import SetupWizardStepPhotos from "./SetupWizardStepPhotos.vue";
import SetupWizardStepSession from "./SetupWizardStepSession.vue";

const props = defineProps({
  fileInputAccept: {
    type: String,
    required: true
  },
  sessionMode: {
    type: String,
    required: true
  },
  durationSeconds: {
    type: [Number, String],
    required: true
  },
  taggedPhotos: {
    type: Array,
    required: true
  },
  availablePhotoTags: {
    type: Array,
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
  canStartSession: {
    type: Boolean,
    required: true
  },
  hasSourcePhotos: {
    type: Boolean,
    required: true
  },
  hasClassPlan: {
    type: Boolean,
    required: true
  },
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
  statusMessage: {
    type: String,
    required: true
  },
  uploadNotice: {
    type: String,
    default: ""
  },
  settingsSaveStatusText: {
    type: String,
    required: true
  },
  sessionPreviewItems: {
    type: Array,
    required: true
  },
  sessionPreviewSummaryText: {
    type: String,
    required: true
  },
  sessionHistory: {
    type: Array,
    required: true
  },
  runSnapshots: {
    type: Array,
    required: true
  }
});

defineEmits([
  "photos-selected",
  "session-mode-change",
  "duration-input",
  "duration-change",
  "photo-tag-update",
  "photo-tag-batch-update",
  "photo-reorder",
  "export-settings",
  "share-settings-link",
  "import-settings",
  "start-session",
  "new-random-set",
  "clear-history",
  "rerun-history",
  "save-history-snapshot",
  "restore-run-snapshot",
  "delete-run-snapshot",
  "open-class-dialog",
  "open-wizard"
]);

const sessionModeLabel = computed(() =>
  props.sessionMode === "class" ? "Class Mode" : "Quick Mode"
);

const planStatusLabel = computed(() => {
  if (props.sessionMode === "quick") {
    const parsedValue = Number.parseInt(String(props.durationSeconds), 10);
    const safeDuration = Number.isFinite(parsedValue) ? Math.max(parsedValue, 0) : 0;
    return `${safeDuration}s each`;
  }

  return props.hasClassPlan ? `${props.classPoseCount} poses` : "Needs plan";
});
</script>