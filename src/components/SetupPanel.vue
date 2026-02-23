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

  <PhotoTagManagerSection
    v-if="taggedPhotos.length > 0"
    :tagged-photos="taggedPhotos"
    :available-photo-tags="availablePhotoTags"
    @photo-tag-update="$emit('photo-tag-update', $event)"
  />

  <section v-if="sessionMode === 'quick'" class="grid gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
    <p class="text-sm font-semibold text-slate-100">2. Quick Session</p>
    <DurationInput
      id="durationInput"
      label="Seconds Per Photo"
      :value="durationSeconds"
      @update="$emit('duration-input', $event)"
      @commit="$emit('duration-change')"
    />

    <div class="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2">
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

    <div class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2">
      <BaseButton tone="subtle" @click="openClassDialog">Edit Class Plan</BaseButton>
      <BaseButton :disabled="!hasSourcePhotos || !hasClassPlan" @click="$emit('start-session')">
        {{ startActionLabel }}
      </BaseButton>
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
    @start-session="$emit('start-session')"
    @new-random-set="$emit('new-random-set')"
  />

  <div class="grid gap-1">
    <p class="text-sm text-slate-400" role="status" aria-live="polite">{{ statusMessage }}</p>
    <p v-if="uploadNotice" class="text-sm text-slate-300">{{ uploadNotice }}</p>
    <p class="text-sm text-slate-500">Shortcuts: Space pause/resume, Right Arrow next, Esc end.</p>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import BaseButton from "./BaseButton.vue";
import ClassSessionDialog from "./ClassSessionDialog.vue";
import DurationInput from "./DurationInput.vue";
import PhotoTagManagerSection from "./PhotoTagManagerSection.vue";

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
  "class-preset-change",
  "class-block-update",
  "class-block-add",
  "class-block-remove",
  "class-photo-order-change",
  "class-repeat-toggle",
  "start-session",
  "new-random-set"
]);

function onPhotosSelected(event) {
  emit("photos-selected", event.target?.files || []);

  if (event.target instanceof HTMLInputElement) {
    event.target.value = "";
  }
}

function modeTone(mode) {
  return props.sessionMode === mode ? "primary" : "subtle";
}

const isClassDialogOpen = ref(false);

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
</script>
