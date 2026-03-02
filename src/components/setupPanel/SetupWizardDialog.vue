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
              <h2 id="setup-wizard-title" class="fd-title-gradient text-[1.04rem] font-semibold">
                Setup Wizard
              </h2>
              <p id="setup-wizard-description" class="fd-text-muted text-[13px] leading-5">
                Configure photos, session behavior, and advanced tools step by step.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close setup wizard dialog"
              class="fd-accordion-toggle rounded-md px-2.5 py-1.5 text-xs font-semibold focus-visible:ring-offset-transparent"
              @click="closeWizard"
            >
              Close
            </button>
          </header>

          <div class="mb-3 grid gap-2.5">
            <p class="fd-kicker">
              Step {{ wizardStep }} of {{ wizardStepCount }}
            </p>
            <ol class="grid gap-2 md:grid-cols-3" aria-label="Setup wizard progress">
              <li v-for="step in wizardSteps" :key="`wizard-step-${step.number}`">
                <button
                  type="button"
                  :class="wizardStepCardClass(step.number)"
                  :disabled="!canNavigateToStep(step.number)"
                  :aria-current="wizardStep === step.number ? 'step' : undefined"
                  :aria-describedby="`wizard-step-hint-${step.number}`"
                  @click="setWizardStep(step.number)"
                >
                  <span class="fd-kicker text-[10px]">
                    Step {{ step.number }}
                  </span>
                  <div class="flex items-center justify-between gap-2">
                    <span class="inline-flex items-center gap-1.5 text-[15px] font-semibold">
                      <component :is="step.icon" class="h-4 w-4" aria-hidden="true" />
                      {{ step.title }}
                    </span>
                    <span :class="wizardStepStatusBadgeClass(step.number)">
                      <component :is="wizardStepStatusIcon(step.number)" class="h-3 w-3" aria-hidden="true" />
                      {{ wizardStepStatusLabel(step.number) }}
                    </span>
                  </div>
                  <span :id="`wizard-step-hint-${step.number}`" class="fd-text-muted text-[12px] leading-5">
                    {{ step.hint }}
                  </span>
                </button>
              </li>
            </ol>
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
            @photo-tag-batch-update="$emit('photo-tag-batch-update', $event)"
            @photo-reorder="$emit('photo-reorder', $event)"
            @export-settings="$emit('export-settings')"
            @share-settings-link="$emit('share-settings-link')"
            @import-settings="onImportSettingsSelected"
            @clear-history="$emit('clear-history')"
          />

          <footer class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[rgb(var(--fd-border)/0.82)] pt-3">
            <div class="flex items-center gap-2">
              <BaseButton compact tone="subtle" :disabled="wizardStep === 1" @click="goToPreviousWizardStep">
                Back
              </BaseButton>
              <p class="fd-text-muted text-[12px]">
                {{ wizardStepStatusLabel(wizardStep) }}
              </p>
            </div>
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
import { Circle, CircleCheckBig, CircleDot, Images, Lock, SlidersHorizontal, Timer } from "lucide-vue-next";
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
  "photo-tag-batch-update",
  "photo-reorder",
  "export-settings",
  "share-settings-link",
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

const wizardSteps = [
  {
    number: 1,
    title: "Photos",
    hint: "Add source images.",
    icon: Images
  },
  {
    number: 2,
    title: "Session",
    hint: "Set mode, timing, and preview.",
    icon: Timer
  },
  {
    number: 3,
    title: "Advanced",
    hint: "Tags, transfer, and history.",
    icon: SlidersHorizontal
  }
];

function wizardStepState(stepNumber) {
  if (stepNumber === wizardStep.value) {
    return "current";
  }

  if (stepNumber < wizardStep.value && canNavigateToStep(stepNumber)) {
    return "done";
  }

  if (!canNavigateToStep(stepNumber)) {
    return "locked";
  }

  return "ready";
}

function wizardStepStatusLabel(stepNumber) {
  const stepState = wizardStepState(stepNumber);
  if (stepState === "done") {
    return "Done";
  }

  if (stepState === "current") {
    return "Current";
  }

  if (stepState === "locked") {
    return "Locked";
  }

  return "Ready";
}

function wizardStepStatusIcon(stepNumber) {
  const stepState = wizardStepState(stepNumber);
  if (stepState === "done") {
    return CircleCheckBig;
  }

  if (stepState === "current") {
    return CircleDot;
  }

  if (stepState === "locked") {
    return Lock;
  }

  return Circle;
}

function wizardStepStatusBadgeClass(stepNumber) {
  const baseClass =
    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]";
  const stepState = wizardStepState(stepNumber);

  if (stepState === "done") {
    return `${baseClass} fd-badge-success`;
  }

  if (stepState === "current") {
    return `${baseClass} fd-badge-active`;
  }

  if (stepState === "locked") {
    return `${baseClass} fd-badge-locked`;
  }

  return `${baseClass} fd-badge-ready`;
}

function wizardStepCardClass(stepNumber) {
  const baseClass =
    "grid w-full gap-1.5 rounded-lg border px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed";
  const stepState = wizardStepState(stepNumber);

  if (stepState === "current") {
    return `${baseClass} fd-nested-surface fd-text-strong shadow-sm`;
  }

  if (stepState === "done") {
    return `${baseClass} fd-callout fd-text-body`;
  }

  if (stepState === "locked") {
    return `${baseClass} fd-callout-muted fd-text-muted opacity-90`;
  }

  return `${baseClass} fd-callout fd-text-body hover:bg-white`;
}

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
