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

    <div class="grid gap-2">
      <p class="text-xs uppercase tracking-wide text-slate-400">Class Length Preset</p>
      <div class="grid grid-cols-3 gap-2 max-[560px]:grid-cols-1">
        <BaseButton
          v-for="preset in classPresetOptions"
          :key="preset.id"
          compact
          :tone="presetTone(preset.id)"
          @click="$emit('class-preset-change', preset.id)"
        >
          {{ preset.label }}
        </BaseButton>
      </div>
    </div>

    <div class="grid gap-2">
      <p class="text-xs uppercase tracking-wide text-slate-400">Pose Blocks</p>
      <article
        v-for="(block, index) in classBlocks"
        :key="`pose-block-${index}`"
        class="grid gap-2 rounded-md border border-slate-700 bg-slate-950/50 p-2.5"
      >
        <label class="grid gap-1 text-xs text-slate-300">
          <span>Block Name</span>
          <input
            type="text"
            :value="block.label"
            class="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            @input="onBlockLabelInput(index, $event)"
          />
        </label>

        <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
          <label class="grid gap-1 text-xs text-slate-300">
            <span>Seconds Per Pose</span>
            <input
              type="number"
              min="5"
              max="7200"
              :value="block.durationSeconds"
              class="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              @change="onBlockDurationChange(index, $event)"
            />
          </label>

          <label class="grid gap-1 text-xs text-slate-300">
            <span>Pose Count</span>
            <input
              type="number"
              min="1"
              max="200"
              :value="block.poseCount"
              class="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              @change="onBlockCountChange(index, $event)"
            />
          </label>
        </div>

        <BaseButton
          compact
          tone="danger"
          :disabled="classBlocks.length <= 1"
          @click="$emit('class-block-remove', index)"
        >
          Remove Block
        </BaseButton>
      </article>

      <BaseButton compact tone="subtle" @click="$emit('class-block-add')">Add Block</BaseButton>
    </div>

    <div class="grid gap-2">
      <p class="text-xs uppercase tracking-wide text-slate-400">Photo Sequence</p>
      <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
        <BaseButton compact :tone="photoOrderTone('shuffle')" @click="$emit('class-photo-order-change', 'shuffle')">
          Shuffle Photos
        </BaseButton>
        <BaseButton
          compact
          :tone="photoOrderTone('sequential')"
          @click="$emit('class-photo-order-change', 'sequential')"
        >
          Upload Order
        </BaseButton>
      </div>
      <label class="inline-flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          class="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500 focus-visible:ring-sky-400"
          :checked="avoidImmediateRepeats"
          :disabled="classPhotoOrder === 'sequential'"
          @change="onRepeatToggle"
        />
        <span>Avoid back-to-back repeats while shuffling.</span>
      </label>
    </div>

    <div class="grid gap-1 rounded-md border border-slate-700 bg-slate-950/50 px-2.5 py-2 text-sm text-slate-300">
      <p>
        Plan total:
        <span class="font-semibold text-slate-100">{{ classTotalMinutesText }}</span>
        across {{ classPoseCount }} poses.
      </p>
      <p>Preset target: {{ classTargetMinutes }} minutes ({{ classDeltaText }}).</p>
    </div>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2">
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

  <div class="grid gap-1">
    <p class="text-sm text-slate-400" role="status" aria-live="polite">{{ statusMessage }}</p>
    <p v-if="uploadNotice" class="text-sm text-slate-300">{{ uploadNotice }}</p>
    <p class="text-sm text-slate-500">Shortcuts: Space pause/resume, Right Arrow next, Esc end.</p>
  </div>
</template>

<script setup>
import BaseButton from "./BaseButton.vue";
import DurationInput from "./DurationInput.vue";

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
}

function modeTone(mode) {
  return props.sessionMode === mode ? "primary" : "subtle";
}

function presetTone(presetId) {
  return props.classPresetId === presetId ? "primary" : "subtle";
}

function photoOrderTone(order) {
  return props.classPhotoOrder === order ? "primary" : "subtle";
}

function onBlockLabelInput(index, event) {
  emit("class-block-update", {
    index,
    field: "label",
    value: event.target.value
  });
}

function onBlockDurationChange(index, event) {
  emit("class-block-update", {
    index,
    field: "durationSeconds",
    value: event.target.value
  });
}

function onBlockCountChange(index, event) {
  emit("class-block-update", {
    index,
    field: "poseCount",
    value: event.target.value
  });
}

function onRepeatToggle(event) {
  emit("class-repeat-toggle", event.target.checked);
}
</script>
