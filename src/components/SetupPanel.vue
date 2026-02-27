<template>
  <div class="landing-stack grid gap-3 stagger-in">
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
      @start-session="$emit('start-session')"
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

    <SetupWizardDialog
      ref="wizardDialogRef"
      v-bind="props"
      :is-class-dialog-open="isClassDialogOpen"
      @photos-selected="$emit('photos-selected', $event)"
      @session-mode-change="$emit('session-mode-change', $event)"
      @duration-input="$emit('duration-input', $event)"
      @duration-change="$emit('duration-change')"
      @photo-tag-update="$emit('photo-tag-update', $event)"
      @photo-reorder="$emit('photo-reorder', $event)"
      @export-settings="$emit('export-settings')"
      @import-settings="$emit('import-settings', $event)"
      @start-session="$emit('start-session')"
      @new-random-set="$emit('new-random-set')"
      @clear-history="$emit('clear-history')"
      @open-class-dialog="openClassDialog"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import ClassSessionDialog from "./ClassSessionDialog.vue";
import SetupOverviewCard from "./setupPanel/SetupOverviewCard.vue";
import { setupPanelEmits, setupPanelProps } from "./setupPanel/setupPanelContract";
import SetupWizardDialog from "./setupPanel/SetupWizardDialog.vue";

const props = defineProps(setupPanelProps);

defineEmits(setupPanelEmits);

const wizardDialogRef = ref(null);
const isClassDialogOpen = ref(false);

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

function openClassDialog() {
  isClassDialogOpen.value = true;
}

function closeClassDialog() {
  isClassDialogOpen.value = false;
}

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
</script>
