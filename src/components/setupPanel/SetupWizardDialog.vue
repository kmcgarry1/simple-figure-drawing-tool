<template>
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
              <h2 id="setup-wizard-title" class="fd-title-gradient text-base font-semibold">
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

          <SetupWizardStepPhotos
            v-if="wizardStep === 1"
            :file-input-accept="fileInputAccept"
            :tagged-photos="taggedPhotos"
            @photos-selected="onPhotosSelected"
          />

          <SetupWizardStepSession
            v-else-if="wizardStep === 2"
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
            @start-session="startSessionFromWizard"
            @new-random-set="$emit('new-random-set')"
            @open-class-dialog="openClassDialog"
          />

          <SetupWizardStepAdvanced
            v-else
            :tagged-photos="taggedPhotos"
            :available-photo-tags="availablePhotoTags"
            :session-history="sessionHistory"
            @photo-tag-update="$emit('photo-tag-update', $event)"
            @photo-reorder="$emit('photo-reorder', $event)"
            @export-settings="$emit('export-settings')"
            @import-settings="onImportSettingsSelected"
            @clear-history="$emit('clear-history')"
          />

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
</template>

<script setup>
import { computed, ref, watch } from "vue";
import BaseButton from "../BaseButton.vue";
import { setupPanelProps } from "./setupPanelContract";
import SetupWizardStepAdvanced from "./SetupWizardStepAdvanced.vue";
import SetupWizardStepPhotos from "./SetupWizardStepPhotos.vue";
import SetupWizardStepSession from "./SetupWizardStepSession.vue";
import { useSetupWizardFlow } from "./useSetupWizardFlow";
import { useSetupWizardFocusManagement } from "./useSetupWizardFocusManagement";

const props = defineProps({
  ...setupPanelProps,
  isClassDialogOpen: {
    type: Boolean,
    default: false
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
  "start-session",
  "new-random-set",
  "clear-history",
  "open-class-dialog",
  "wizard-step-change"
]);

const {
  wizardStepCount,
  wizardStep,
  isWizardOpen,
  canStartSession,
  canAdvanceWizardStep,
  canNavigateToStep,
  wizardStepButtonClass,
  setWizardStep,
  goToNextWizardStep,
  goToPreviousWizardStep,
  openWizard,
  closeWizard
} = useSetupWizardFlow({
  sessionMode: computed(() => props.sessionMode),
  hasClassPlan: computed(() => props.hasClassPlan),
  hasSourcePhotos: computed(() => props.hasSourcePhotos)
});

const wizardDialogRef = ref(null);
const { onWizardKeydown } = useSetupWizardFocusManagement({
  isWizardOpen,
  wizardDialogRef,
  isClassDialogOpen: computed(() => props.isClassDialogOpen),
  closeWizard
});

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

function openClassDialog() {
  emit("open-class-dialog");
}

function startSessionFromWizard() {
  emit("start-session");
  closeWizard();
}

watch(
  [wizardStep, isWizardOpen],
  ([nextStep, nextIsOpen]) => {
    if (!nextIsOpen) {
      return;
    }

    emit("wizard-step-change", nextStep);
  },
  { immediate: true }
);

defineExpose({
  openWizard,
  closeWizard
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
