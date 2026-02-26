<template>
  <label class="grid gap-1.5 text-sm text-slate-200" for="photoInput">
    <span class="font-medium">Upload Photos</span>
    <input
      id="photoInput"
      type="file"
      :accept="fileInputAccept"
      multiple
      class="w-full rounded-md border border-slate-600 bg-slate-900 px-2.5 py-2 text-sm text-slate-100 file:mr-2 file:cursor-pointer file:rounded file:border file:border-slate-600 file:bg-slate-700 file:px-2 file:py-1 file:text-sm file:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      @change="onPhotosSelected"
    />
  </label>

  <section class="grid gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
    <div class="flex items-center justify-between gap-2">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Builder Progress</p>
      <p class="text-xs text-slate-400">{{ progressLabel }}</p>
    </div>
    <div class="h-1.5 overflow-hidden rounded-full bg-slate-700">
      <div
        class="h-full rounded-full bg-sky-500 transition-[width] duration-200"
        :style="{ width: `${progressPercent}%` }"
      />
    </div>
    <div class="grid grid-cols-3 gap-2 text-xs max-[560px]:grid-cols-1">
      <div :class="stepCardClass(1)">
        <p class="font-semibold uppercase tracking-wide text-[10px]">Step 1</p>
        <p class="mt-0.5 text-slate-100">Add source photos</p>
      </div>
      <div :class="stepCardClass(2)">
        <p class="font-semibold uppercase tracking-wide text-[10px]">Step 2</p>
        <p class="mt-0.5 text-slate-100">Configure session</p>
      </div>
      <div :class="stepCardClass(3)">
        <p class="font-semibold uppercase tracking-wide text-[10px]">Step 3</p>
        <p class="mt-0.5 text-slate-100">Start drawing</p>
      </div>
    </div>
  </section>

  <section class="grid gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Essentials</p>
    <p class="text-sm font-semibold text-slate-100">1. Session Type</p>
    <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
      <BaseButton :tone="modeTone('class')" @click="$emit('session-mode-change', 'class')">
        Life Class Wizard
      </BaseButton>
      <BaseButton :tone="modeTone('quick')" @click="$emit('session-mode-change', 'quick')">
        Quick Session
      </BaseButton>
    </div>
  </section>

  <section v-if="sessionMode === 'quick'" class="grid gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
    <p class="text-sm font-semibold text-slate-100">2. Quick Session</p>
    <DurationInput
      id="durationInput"
      label="Seconds Per Photo"
      :value="durationSeconds"
      @update="$emit('duration-input', $event)"
      @commit="$emit('duration-change')"
    />

    <div class="grid gap-2">
      <BaseButton :disabled="!hasSourcePhotos" @click="$emit('start-session')">
        {{ startActionLabel }}
      </BaseButton>
      <BaseButton :disabled="!hasSourcePhotos" tone="subtle" @click="$emit('new-random-set')">
        {{ regenerateActionLabel }}
      </BaseButton>
    </div>
  </section>

  <section v-else class="grid gap-3 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
    <p class="text-sm font-semibold text-slate-100">2. Life Drawing Class Wizard</p>

    <div class="grid gap-1 rounded-md border border-slate-700 bg-slate-950/50 px-2.5 py-2 text-sm text-slate-300">
      <p>
        Plan total:
        <span class="font-semibold text-slate-100">{{ classTotalMinutesText }}</span>
        across {{ classPoseCount }} poses.
      </p>
      <p>Preset target: {{ classTargetMinutes }} minutes ({{ classDeltaText }}).</p>
    </div>

    <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
      <div class="col-span-2 max-[560px]:col-span-1">
        <BaseButton :disabled="!hasSourcePhotos || !hasClassPlan" @click="$emit('start-session')">
          {{ startActionLabel }}
        </BaseButton>
      </div>
      <BaseButton tone="subtle" @click="openClassDialog">Edit Class Plan</BaseButton>
      <BaseButton
        :disabled="!hasSourcePhotos || !hasClassPlan"
        tone="subtle"
        @click="$emit('new-random-set')"
      >
        {{ regenerateActionLabel }}
      </BaseButton>
    </div>
  </section>

  <ClassSessionDialog
    v-if="sessionMode === 'class'"
    :is-open="isClassDialogOpen"
    :class-preset-options="classPresetOptions"
    :class-preset-id="classPresetId"
    :class-blocks="classBlocks"
    :available-photo-tags="availablePhotoTags"
    :class-photo-order="classPhotoOrder"
    :avoid-immediate-repeats="avoidImmediateRepeats"
    :class-templates="classTemplates"
    :has-class-plan="hasClassPlan"
    :class-target-minutes="classTargetMinutes"
    :class-pose-count="classPoseCount"
    :class-total-minutes-text="classTotalMinutesText"
    :class-delta-text="classDeltaText"
    :start-action-label="startActionLabel"
    :regenerate-action-label="regenerateActionLabel"
    :has-source-photos="hasSourcePhotos"
    @close="closeClassDialog"
    @class-preset-change="$emit('class-preset-change', $event)"
    @class-block-update="$emit('class-block-update', $event)"
    @class-block-add="$emit('class-block-add')"
    @class-block-remove="$emit('class-block-remove', $event)"
    @class-photo-order-change="$emit('class-photo-order-change', $event)"
    @class-repeat-toggle="$emit('class-repeat-toggle', $event)"
    @class-template-save="$emit('class-template-save', $event)"
    @class-template-load="$emit('class-template-load', $event)"
    @class-template-delete="$emit('class-template-delete', $event)"
    @start-session="$emit('start-session')"
    @new-random-set="$emit('new-random-set')"
  />

  <section class="grid gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
    <div class="flex items-center justify-between gap-2">
      <div class="grid gap-0.5">
        <p class="text-sm font-semibold text-slate-100">Advanced Tools</p>
        <p class="text-xs text-slate-400">
          Tags, templates, import/export, and session history.
        </p>
      </div>
      <BaseButton compact tone="subtle" @click="toggleAdvancedTools">
        {{ isAdvancedToolsOpen ? "Hide" : "Show" }}
      </BaseButton>
    </div>

    <div v-if="isAdvancedToolsOpen" class="grid gap-3">
      <PhotoTagManagerSection
        v-if="taggedPhotos.length > 0"
        :tagged-photos="taggedPhotos"
        :available-photo-tags="availablePhotoTags"
        @photo-tag-update="$emit('photo-tag-update', $event)"
      />

      <section class="grid gap-2 rounded-md border border-slate-700 bg-slate-950/40 p-2.5">
        <p class="text-sm font-semibold text-slate-100">Settings Transfer</p>
        <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
          <BaseButton tone="subtle" @click="$emit('export-settings')">Export JSON</BaseButton>
          <label class="grid gap-1 text-xs text-slate-300">
            <span>Import JSON</span>
            <input
              type="file"
              accept="application/json,.json"
              class="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              @change="onImportSettingsSelected"
            />
          </label>
        </div>
      </section>

      <SessionHistorySection :session-history="sessionHistory" @clear-history="$emit('clear-history')" />
    </div>
  </section>

  <div class="grid gap-1.5 rounded-md border border-slate-700 bg-slate-900/50 px-2.5 py-2">
    <p class="text-sm text-slate-300" role="status" aria-live="polite">{{ statusMessage }}</p>
    <p v-if="uploadNotice" class="text-sm text-slate-300">{{ uploadNotice }}</p>
    <p class="text-xs text-slate-500">Shortcuts: Space pause/resume, Right Arrow next, Esc end.</p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import BaseButton from "./BaseButton.vue";
import ClassSessionDialog from "./ClassSessionDialog.vue";
import DurationInput from "./DurationInput.vue";
import PhotoTagManagerSection from "./PhotoTagManagerSection.vue";
import SessionHistorySection from "./SessionHistorySection.vue";

const props = defineProps({
  sessionMode: {
    type: String,
    required: true
  },
  fileInputAccept: {
    type: String,
    required: true
  },
  durationSeconds: {
    type: [Number, String],
    required: true
  },
  classPresetOptions: {
    type: Array,
    required: true
  },
  classPresetId: {
    type: String,
    required: true
  },
  classBlocks: {
    type: Array,
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
  classPhotoOrder: {
    type: String,
    required: true
  },
  avoidImmediateRepeats: {
    type: Boolean,
    required: true
  },
  classTemplates: {
    type: Array,
    required: true
  },
  hasClassPlan: {
    type: Boolean,
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
  sessionHistory: {
    type: Array,
    required: true
  },
  statusMessage: {
    type: String,
    required: true
  },
  uploadNotice: {
    type: String,
    default: ""
  }
});

const emit = defineEmits([
  "photos-selected",
  "session-mode-change",
  "duration-input",
  "duration-change",
  "photo-tag-update",
  "export-settings",
  "import-settings",
  "class-preset-change",
  "class-block-update",
  "class-block-add",
  "class-block-remove",
  "class-photo-order-change",
  "class-repeat-toggle",
  "class-template-save",
  "class-template-load",
  "class-template-delete",
  "start-session",
  "new-random-set",
  "clear-history"
]);

function onPhotosSelected(event) {
  emit("photos-selected", event.target?.files || []);

  if (event.target instanceof HTMLInputElement) {
    event.target.value = "";
  }
}

function onImportSettingsSelected(event) {
  const file = event.target?.files?.[0] || null;
  emit("import-settings", file);

  if (event.target instanceof HTMLInputElement) {
    event.target.value = "";
  }
}

function modeTone(mode) {
  return props.sessionMode === mode ? "primary" : "subtle";
}

const isSessionConfigured = computed(() =>
  props.sessionMode === "quick" ? true : props.hasClassPlan
);

const canStartSession = computed(() =>
  props.sessionMode === "quick"
    ? props.hasSourcePhotos
    : props.hasSourcePhotos && props.hasClassPlan
);

const currentStep = computed(() => {
  if (!props.hasSourcePhotos) {
    return 1;
  }

  if (!isSessionConfigured.value) {
    return 2;
  }

  return 3;
});

const completedStepCount = computed(() => {
  const flags = [props.hasSourcePhotos, isSessionConfigured.value, canStartSession.value];
  return flags.filter(Boolean).length;
});

const progressPercent = computed(() => Math.round((completedStepCount.value / 3) * 100));
const progressLabel = computed(() => `${completedStepCount.value}/3 ready`);

function stepCardClass(stepNumber) {
  const baseClass = "rounded-md border px-2 py-1.5 transition-colors";

  if (stepNumber < currentStep.value) {
    return `${baseClass} border-emerald-500/70 bg-emerald-600/15 text-emerald-100`;
  }

  if (stepNumber === currentStep.value) {
    return `${baseClass} border-sky-500/70 bg-sky-600/15 text-sky-100`;
  }

  return `${baseClass} border-slate-600 bg-slate-950/40 text-slate-400`;
}

const isClassDialogOpen = ref(false);
const isAdvancedToolsOpen = ref(false);

watch(
  () => props.sessionMode,
  (nextMode, previousMode) => {
    if (nextMode !== "class") {
      isClassDialogOpen.value = false;
      return;
    }

    if (previousMode === "quick") {
      isClassDialogOpen.value = true;
    }
  }
);

function openClassDialog() {
  isClassDialogOpen.value = true;
}

function closeClassDialog() {
  isClassDialogOpen.value = false;
}

function toggleAdvancedTools() {
  isAdvancedToolsOpen.value = !isAdvancedToolsOpen.value;
}
</script>
