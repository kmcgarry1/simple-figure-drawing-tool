<template>
  <div class="landing-stack grid gap-4 stagger-in">
    <SetupOverviewCard
      :landing-summary="landingSummary"
      :progress-label="progressLabel"
      :progress-percent="progressPercent"
      :wizard-action-label="wizardActionLabel"
      :start-action-label="startActionLabel"
      :regenerate-action-label="regenerateActionLabel"
      :can-start-session="canStartSession"
      :has-source-photos="hasSourcePhotos"
      :status-message="statusMessage"
      :upload-notice="uploadNotice"
      :settings-save-status-text="settingsSaveStatusText"
      @open-wizard="openWizard"
      @start-session="handleStartSession"
      @new-random-set="$emit('new-random-set')"
    />

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
      :session-preview-items="sessionPreviewItems"
      :session-preview-summary-text="sessionPreviewSummaryText"
      @close="closeClassDialog"
      @class-preset-change="$emit('class-preset-change', $event)"
      @class-block-update="$emit('class-block-update', $event)"
      @class-block-add="$emit('class-block-add', $event)"
      @class-block-remove="$emit('class-block-remove', $event)"
      @class-assistant-generate="$emit('class-assistant-generate', $event)"
      @class-photo-order-change="$emit('class-photo-order-change', $event)"
      @class-repeat-toggle="$emit('class-repeat-toggle', $event)"
      @class-template-save="$emit('class-template-save', $event)"
      @class-template-load="$emit('class-template-load', $event)"
      @class-template-delete="$emit('class-template-delete', $event)"
      @class-template-rename="$emit('class-template-rename', $event)"
      @class-template-duplicate="$emit('class-template-duplicate', $event)"
      @class-template-export="$emit('class-template-export')"
      @class-template-import="$emit('class-template-import', $event)"
      @start-session="handleStartSession"
      @new-random-set="$emit('new-random-set')"
    />

    <SetupWizardDialog
      ref="wizardDialogRef"
      v-bind="props"
      :is-class-dialog-open="isClassDialogOpen"
      @photos-selected="$emit('photos-selected', $event)"
      @session-mode-change="handleSessionModeChange"
      @duration-input="$emit('duration-input', $event)"
      @duration-change="$emit('duration-change')"
      @photo-tag-update="$emit('photo-tag-update', $event)"
      @photo-reorder="$emit('photo-reorder', $event)"
      @export-settings="$emit('export-settings')"
      @share-settings-link="$emit('share-settings-link')"
      @import-settings="$emit('import-settings', $event)"
      @start-session="handleStartSession"
      @new-random-set="$emit('new-random-set')"
      @clear-history="$emit('clear-history')"
      @open-class-dialog="openClassDialog"
      @wizard-step-change="handleWizardStepChange"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import ClassSessionDialog from "./ClassSessionDialog.vue";
import SetupOverviewCard from "./setupPanel/SetupOverviewCard.vue";
import { setupPanelEmits, setupPanelProps } from "./setupPanel/setupPanelContract";
import SetupWizardDialog from "./setupPanel/SetupWizardDialog.vue";

const SETUP_MODE_QUERY_PARAM = "setupMode";
const SETUP_STEP_QUERY_PARAM = "setupStep";
const MIN_SETUP_STEP = 1;
const MAX_SETUP_STEP = 3;
const VALID_SETUP_MODES = new Set(["class", "quick"]);

const props = defineProps(setupPanelProps);

const emit = defineEmits(setupPanelEmits);

const wizardDialogRef = ref(null);
const isClassDialogOpen = ref(false);
const initialDeepLinkState = readSetupDeepLinkState();

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

function openWizard() {
  wizardDialogRef.value?.openWizard();
}

function handleStartSession() {
  if (props.sessionMode === "class") {
    isClassDialogOpen.value = false;
  }
  emit("start-session");
}

function handleSessionModeChange(nextMode) {
  emit("session-mode-change", nextMode);
}

function openClassDialog() {
  isClassDialogOpen.value = true;
}

function closeClassDialog() {
  isClassDialogOpen.value = false;
}

function normalizeSetupStep(rawStep) {
  const parsedStep = Number.parseInt(String(rawStep ?? ""), 10);
  if (!Number.isInteger(parsedStep)) {
    return null;
  }

  return Math.min(MAX_SETUP_STEP, Math.max(MIN_SETUP_STEP, parsedStep));
}

function readSetupDeepLinkState() {
  if (typeof window === "undefined") {
    return { mode: null, step: null };
  }

  const params = new URLSearchParams(window.location.search);
  const rawMode = String(params.get(SETUP_MODE_QUERY_PARAM) || "").trim();
  const mode = VALID_SETUP_MODES.has(rawMode) ? rawMode : null;

  return {
    mode,
    step: normalizeSetupStep(params.get(SETUP_STEP_QUERY_PARAM))
  };
}

function replaceSetupDeepLinkState({ mode, step }) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  if (VALID_SETUP_MODES.has(mode)) {
    url.searchParams.set(SETUP_MODE_QUERY_PARAM, mode);
  } else {
    url.searchParams.delete(SETUP_MODE_QUERY_PARAM);
  }

  if (step === null) {
    url.searchParams.delete(SETUP_STEP_QUERY_PARAM);
  } else {
    url.searchParams.set(SETUP_STEP_QUERY_PARAM, String(step));
  }

  const nextRelativeUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentRelativeUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextRelativeUrl === currentRelativeUrl) {
    return;
  }

  window.history.replaceState(window.history.state, "", nextRelativeUrl);
}

function handleWizardStepChange(nextStep) {
  replaceSetupDeepLinkState({
    mode: props.sessionMode,
    step: normalizeSetupStep(nextStep)
  });
}

onMounted(() => {
  if (initialDeepLinkState.mode && initialDeepLinkState.mode !== props.sessionMode) {
    emit("session-mode-change", initialDeepLinkState.mode);
  }

  if (initialDeepLinkState.step !== null) {
    nextTick(() => {
      wizardDialogRef.value?.openWizard(initialDeepLinkState.step);
    });
  }
});

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
  () => props.sessionMode,
  (nextMode) => {
    const currentStep = readSetupDeepLinkState().step;
    replaceSetupDeepLinkState({
      mode: nextMode,
      step: currentStep
    });
  }
);
</script>
