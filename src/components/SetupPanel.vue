<template>
  <div class="landing-stack grid gap-3 stagger-in">
    <section
      class="fd-hero-surface relative grid gap-3 overflow-hidden rounded-xl p-4"
    >
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
        <p class="rounded-full border border-amber-300/70 bg-orange-100/60 px-2.5 py-0.5 text-xs font-medium text-stone-700">
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
        <BaseButton @click="openWizard">
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
      <p class="text-xs text-stone-500">Shortcuts: Space pause/resume, Right Arrow next, Esc end.</p>
    </div>

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
      @start-session="startSessionFromWizard"
      @new-random-set="$emit('new-random-set')"
    />

    <Teleport to="body">
      <Transition appear name="dialog-fade">
        <div
          v-if="isWizardOpen"
          class="fixed inset-0 z-[70] grid place-items-center fd-dialog-backdrop p-3 backdrop-blur-[4px]"
          @click.self="closeWizard"
        >
          <section
            ref="wizardDialogRef"
            role="dialog"
            aria-modal="true"
            aria-labelledby="setup-wizard-title"
            aria-describedby="setup-wizard-description"
            tabindex="-1"
            class="fd-modal-surface max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-xl p-4"
            @keydown="onWizardKeydown"
          >
            <header class="mb-3 flex items-start justify-between gap-3">
              <div class="grid gap-1">
                <h2
                  id="setup-wizard-title"
                  class="fd-title-gradient text-base font-semibold"
                >
                  Setup Wizard
                </h2>
                <p id="setup-wizard-description" class="text-sm text-stone-700">
                  Configure photos, session behavior, and advanced tools step by step.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close setup wizard dialog"
                class="rounded-md border border-amber-300/75 bg-white/78 px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                @click="closeWizard"
              >
                Close
              </button>
            </header>

            <div class="mb-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                :class="wizardStepButtonClass(1)"
                @click="setWizardStep(1)"
              >
                1. Photos
              </button>
              <button
                type="button"
                :class="wizardStepButtonClass(2)"
                :disabled="!canNavigateToStep(2)"
                @click="setWizardStep(2)"
              >
                2. Session
              </button>
              <button
                type="button"
                :class="wizardStepButtonClass(3)"
                :disabled="!canNavigateToStep(3)"
                @click="setWizardStep(3)"
              >
                3. Advanced
              </button>
            </div>

            <section
              v-if="wizardStep === 1"
              class="grid gap-3 rounded-lg border border-amber-200/80 bg-white/58 p-3"
            >
              <div class="grid gap-1">
                <p class="text-sm font-semibold text-stone-800">Step 1: Add source photos</p>
                <p class="text-xs text-stone-500">
                  Add files manually or load a folder. The app will validate and randomize from the accepted set.
                </p>
              </div>

              <label class="grid gap-1.5 text-sm text-stone-700" for="photoInput">
                <span class="font-medium">Upload Photos</span>
                <input
                  id="photoInput"
                  type="file"
                  :accept="fileInputAccept"
                  multiple
                  class="w-full rounded-md border border-amber-200/90 bg-white/84 px-2.5 py-2 text-sm text-stone-800 file:mr-2 file:cursor-pointer file:rounded file:border file:border-amber-200/90 file:bg-amber-50 file:px-2 file:py-1 file:text-sm file:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  @change="onPhotosSelected"
                />
              </label>

              <label class="grid gap-1.5 text-sm text-stone-700" for="photoFolderInput">
                <span class="font-medium">Load Photo Folder</span>
                <input
                  id="photoFolderInput"
                  type="file"
                  :accept="fileInputAccept"
                  multiple
                  webkitdirectory
                  directory
                  class="w-full rounded-md border border-amber-200/90 bg-white/84 px-2.5 py-2 text-sm text-stone-800 file:mr-2 file:cursor-pointer file:rounded file:border file:border-amber-200/90 file:bg-amber-50 file:px-2 file:py-1 file:text-sm file:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  @change="onPhotosSelected"
                />
              </label>

              <p class="text-xs text-stone-500">
                Current source pool: {{ taggedPhotos.length }} photo(s).
              </p>
            </section>

            <section
              v-else-if="wizardStep === 2"
              class="grid gap-3 rounded-lg border border-amber-200/80 bg-white/58 p-3"
            >
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
                <BaseButton tone="subtle" @click="openClassDialog">Edit Class Plan</BaseButton>
              </section>

              <div class="grid gap-2">
                <BaseButton :disabled="!canStartSession" @click="startSessionFromWizard">
                  {{ startActionLabel }}
                </BaseButton>
                <BaseButton :disabled="!hasSourcePhotos" tone="subtle" @click="$emit('new-random-set')">
                  {{ regenerateActionLabel }}
                </BaseButton>
              </div>
            </section>

            <section
              v-else
              class="grid gap-3 rounded-lg border border-amber-200/80 bg-white/58 p-3"
            >
              <div class="grid gap-1">
                <p class="text-sm font-semibold text-stone-800">Step 3: Advanced tools</p>
                <p class="text-xs text-stone-500">
                  Fine-tune tags, transfer settings, and manage session history.
                </p>
              </div>

              <PhotoTagManagerSection
                v-if="taggedPhotos.length > 0"
                :tagged-photos="taggedPhotos"
                :available-photo-tags="availablePhotoTags"
                @photo-tag-update="$emit('photo-tag-update', $event)"
                @photo-reorder="$emit('photo-reorder', $event)"
              />

              <section class="grid gap-2 rounded-md border border-amber-200/80 bg-white/56 p-2.5">
                <p class="text-sm font-semibold text-stone-800">Settings Transfer</p>
                <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
                  <BaseButton tone="subtle" @click="$emit('export-settings')">Export JSON</BaseButton>
                  <label class="grid gap-1 text-xs text-stone-600">
                    <span>Import JSON</span>
                    <input
                      type="file"
                      accept="application/json,.json"
                      class="w-full rounded-md border border-amber-200/90 bg-white/84 px-2 py-1.5 text-xs text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                      @change="onImportSettingsSelected"
                    />
                  </label>
                </div>
              </section>

              <SessionHistorySection :session-history="sessionHistory" @clear-history="$emit('clear-history')" />
            </section>

            <footer class="mt-3 flex items-center justify-between gap-2 border-t border-amber-200/80 pt-3">
              <BaseButton compact tone="subtle" :disabled="wizardStep === 1" @click="goToPreviousWizardStep">
                Back
              </BaseButton>
              <div class="ml-auto grid grid-flow-col gap-2">
                <BaseButton compact tone="subtle" @click="closeWizard">Done</BaseButton>
                <BaseButton
                  v-if="wizardStep < wizardStepCount"
                  compact
                  :disabled="!canAdvanceWizardStep"
                  @click="goToNextWizardStep"
                >
                  Next
                </BaseButton>
              </div>
            </footer>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import BaseButton from "./BaseButton.vue";
import ClassSessionDialog from "./ClassSessionDialog.vue";
import DurationInput from "./DurationInput.vue";
import PhotoTagManagerSection from "./PhotoTagManagerSection.vue";
import SessionHistorySection from "./SessionHistorySection.vue";

const FOCUSABLE_SELECTOR = [
  "a[href]:not([tabindex='-1'])",
  "button:not([disabled]):not([tabindex='-1'])",
  "input:not([disabled]):not([type='hidden']):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

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
  "photo-reorder",
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

const wizardStepCount = 3;
const wizardStep = ref(1);
const isWizardOpen = ref(false);
const wizardDialogRef = ref(null);
const previousWizardFocusedElement = ref(null);

function onPhotosSelected(event) {
  emit("photos-selected", event.target?.files || []);

  if (isWizardOpen.value && wizardStep.value === 1) {
    wizardStep.value = 2;
  }

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

const completedStepCount = computed(() => {
  const flags = [props.hasSourcePhotos, isSessionConfigured.value, canStartSession.value];
  return flags.filter(Boolean).length;
});

const progressPercent = computed(() => Math.round((completedStepCount.value / 3) * 100));
const progressLabel = computed(() => `${completedStepCount.value}/3 ready`);

const landingSummary = computed(() => {
  if (!props.hasSourcePhotos) {
    return "No source photos loaded yet.";
  }

  if (props.sessionMode === "quick") {
    return `${props.taggedPhotos.length} photo(s) loaded. Quick mode ready.`;
  }

  if (!props.hasClassPlan) {
    return `${props.taggedPhotos.length} photo(s) loaded. Class plan needs at least one pose block.`;
  }

  return `${props.taggedPhotos.length} photo(s) loaded. Class plan: ${props.classPoseCount} poses.`;
});

const wizardActionLabel = computed(() => {
  if (!props.hasSourcePhotos) {
    return "Open Setup Wizard";
  }

  if (!isSessionConfigured.value) {
    return "Continue Setup Wizard";
  }

  return "Review Setup Wizard";
});

const canAdvanceWizardStep = computed(() => {
  if (wizardStep.value === 1) {
    return true;
  }

  if (wizardStep.value === 2) {
    return isSessionConfigured.value;
  }

  return false;
});

function canNavigateToStep(stepNumber) {
  if (stepNumber <= 2) {
    return true;
  }

  return props.hasSourcePhotos && isSessionConfigured.value;
}

function wizardStepButtonClass(stepNumber) {
  const baseClass =
    "rounded-md border px-2.5 py-2 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

  if (stepNumber === wizardStep.value) {
    return `${baseClass} border-sky-300/80 bg-sky-100/72 text-sky-900`;
  }

  if (!canNavigateToStep(stepNumber)) {
    return `${baseClass} border-amber-200/80 bg-white/56 text-stone-500`;
  }

  if (stepNumber < wizardStep.value) {
    return `${baseClass} border-emerald-300/80 bg-emerald-100/70 text-emerald-800`;
  }

  return `${baseClass} border-amber-200/90 bg-white/70 text-stone-700 hover:bg-white`;
}

function setWizardStep(stepNumber) {
  if (!canNavigateToStep(stepNumber)) {
    return;
  }

  wizardStep.value = Math.min(wizardStepCount, Math.max(1, stepNumber));
}

function goToNextWizardStep() {
  if (!canAdvanceWizardStep.value) {
    return;
  }

  wizardStep.value = Math.min(wizardStepCount, wizardStep.value + 1);
}

function goToPreviousWizardStep() {
  wizardStep.value = Math.max(1, wizardStep.value - 1);
}

function openWizard() {
  isWizardOpen.value = true;

  if (!props.hasSourcePhotos) {
    wizardStep.value = 1;
    return;
  }

  if (canNavigateToStep(3)) {
    wizardStep.value = 3;
    return;
  }

  wizardStep.value = 2;
}

function closeWizard() {
  isWizardOpen.value = false;
}

function startSessionFromWizard() {
  emit("start-session");
  closeWizard();
}

function onWizardKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeWizard();
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusables = Array.from(
    wizardDialogRef.value?.querySelectorAll(FOCUSABLE_SELECTOR) || []
  ).filter(
    (element) => element instanceof HTMLElement && element.getClientRects().length > 0
  );

  if (focusables.length === 0) {
    event.preventDefault();
    wizardDialogRef.value?.focus();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const activeElement = document.activeElement;

  if (event.shiftKey && activeElement === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && activeElement === last) {
    event.preventDefault();
    first.focus();
  }
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

watch(
  () => props.hasSourcePhotos,
  (hasPhotos) => {
    if (isWizardOpen.value && wizardStep.value === 1 && hasPhotos) {
      wizardStep.value = 2;
    }
  }
);

watch(
  isWizardOpen,
  async (nextOpen) => {
    if (nextOpen) {
      previousWizardFocusedElement.value =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      document.body.style.overflow = "hidden";
      await nextTick();
      wizardDialogRef.value?.focus();
      return;
    }

    if (!isClassDialogOpen.value) {
      document.body.style.overflow = "";
    }
    await nextTick();
    previousWizardFocusedElement.value?.focus();
  }
);

watch(isClassDialogOpen, (nextOpen) => {
  if (!nextOpen && isWizardOpen.value) {
    document.body.style.overflow = "hidden";
  }
});

function openClassDialog() {
  isClassDialogOpen.value = true;
}

function closeClassDialog() {
  isClassDialogOpen.value = false;
}

onBeforeUnmount(() => {
  if (!isClassDialogOpen.value) {
    document.body.style.overflow = "";
  }
});
</script>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 180ms ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active section,
.dialog-fade-leave-active section {
  transition: transform 180ms ease, opacity 180ms ease;
}

.dialog-fade-enter-from section,
.dialog-fade-leave-to section {
  opacity: 0;
  transform: translateY(10px) scale(0.985);
}

@media (prefers-reduced-motion: reduce) {
  .dialog-fade-enter-active,
  .dialog-fade-leave-active,
  .dialog-fade-enter-active section,
  .dialog-fade-leave-active section {
    transition: none;
  }
}
</style>

