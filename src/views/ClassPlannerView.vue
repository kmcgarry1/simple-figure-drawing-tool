<template>
  <section class="fd-page">
    <div class="fd-page-heading">
      <p class="fd-section-label">{{ pageEyebrow }}</p>
      <h1 class="fd-page-title">{{ pageTitle }}</h1>
      <p class="fd-text-muted text-base">{{ pageDescription }}</p>
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div class="grid gap-4">
        <div class="fd-stepper" role="group" aria-label="Class planning steps">
          <button
            v-for="step in steps"
            :key="step.id"
            type="button"
            class="fd-step-button"
            :class="{ 'is-active': currentStep === step.id }"
            :aria-pressed="currentStep === step.id ? 'true' : 'false'"
            @click="currentStep = step.id"
          >
            <span class="fd-kicker">{{ step.label }}</span>
            <span class="fd-text-strong text-sm font-semibold">{{ step.title }}</span>
          </button>
        </div>

        <section v-if="currentStep === 'target'" class="fd-page-panel">
          <div class="grid gap-1">
            <p class="fd-section-label">Target</p>
            <p class="fd-text-strong text-lg font-semibold">Choose the class length</p>
            <p class="fd-text-muted text-sm">Preset selection stays primary. The assistant is only a quick first draft.</p>
          </div>
          <div class="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div class="fd-card rounded-2xl p-4">
              <ClassPresetSection
                :class-preset-options="session.classPresetOptions"
                :class-preset-id="session.classPresetId.value"
                @class-preset-change="session.setClassPreset"
              />
            </div>
            <div class="fd-subtle-card rounded-2xl p-4">
              <ClassBuilderAssistantSection
                :class-preset-options="session.classPresetOptions"
                :class-preset-id="session.classPresetId.value"
                :available-photo-tags="session.availablePhotoTags.value"
                @class-assistant-generate="session.applyClassBuilderAssistant"
              />
            </div>
          </div>
        </section>

        <section v-else-if="currentStep === 'blocks'" class="fd-page-panel">
          <div class="grid gap-1">
            <p class="fd-section-label">Blocks</p>
            <p class="fd-text-strong text-lg font-semibold">Edit the timing structure</p>
          </div>
          <ClassPoseBlocksSection
            :class-blocks="session.classBlocks.value"
            :available-photo-tags="session.availablePhotoTags.value"
            @class-block-update="session.updateClassBlock"
            @class-block-add="session.addClassBlock"
            @class-block-remove="session.removeClassBlock"
          />
        </section>

        <section v-else-if="currentStep === 'sequence'" class="fd-page-panel">
          <div class="grid gap-1">
            <p class="fd-section-label">Sequence</p>
            <p class="fd-text-strong text-lg font-semibold">Control photo order</p>
          </div>
          <div v-if="!classBuilderDraft.hasSourcePhotos" class="fd-callout rounded-2xl p-4">
            <p class="fd-text-body text-sm">Add references in Studio before you finalize the class sequence.</p>
            <BaseButton class="mt-3" tone="subtle" @click="router.push('/studio')">
              <ArrowLeft class="fd-inline-icon-sm" aria-hidden="true" />
              Go To Studio
            </BaseButton>
          </div>
          <ClassPhotoSequenceSection
            v-else
            :class-photo-order="session.classPhotoOrder.value"
            :avoid-immediate-repeats="session.avoidImmediateRepeats.value"
            @class-photo-order-change="session.setClassPhotoOrder"
            @class-repeat-toggle="session.setAvoidImmediateRepeats"
          />
        </section>

        <section v-else class="fd-page-panel">
          <div class="grid gap-1">
            <p class="fd-section-label">Review</p>
            <p class="fd-text-strong text-lg font-semibold">Launch from this step only</p>
            <p class="fd-text-muted text-sm">{{ classBuilderDraft.previewSummaryText }}</p>
          </div>

          <div v-if="!classBuilderDraft.hasSourcePhotos" class="fd-callout rounded-2xl p-4">
            <p class="fd-text-body text-sm">Add references in Studio before starting a class session.</p>
            <BaseButton class="mt-3" tone="subtle" @click="router.push('/studio')">
              <ArrowLeft class="fd-inline-icon-sm" aria-hidden="true" />
              Go To Studio
            </BaseButton>
          </div>

          <SessionPreviewSection
            :preview-items="classBuilderDraft.previewItems"
            :preview-summary-text="classBuilderDraft.previewSummaryText"
          />

          <details class="fd-card fd-disclosure rounded-2xl p-4">
            <summary class="fd-disclosure-summary">
              <div class="grid gap-1">
                <p class="fd-section-label">Templates & Sync</p>
                <p class="fd-text-strong text-sm font-semibold">
                  Saved templates ({{ classBuilderDraft.templateCount }})
                </p>
              </div>
              <span class="fd-chip rounded-full px-2.5 py-1 text-xs font-semibold">Optional</span>
            </summary>
            <div class="mt-4">
              <ClassTemplatesSection
                :class-templates="session.classTemplates.value"
                :class-template-sync-enabled="session.classTemplateSyncEnabled"
                :class-template-sync-key="session.classTemplateSyncKey.value"
                @class-template-save="session.saveClassTemplateByName"
                @class-template-load="session.loadClassTemplateById"
                @class-template-delete="session.deleteClassTemplateById"
                @class-template-rename="session.renameClassTemplateById"
                @class-template-duplicate="session.duplicateClassTemplateById"
                @class-template-export="session.exportClassTemplatesJson"
                @class-template-import="session.importClassTemplatesFromFile"
                @class-template-sync-key-change="session.setClassTemplateSyncKey"
                @class-template-sync-pull="session.pullClassTemplatesFromSync"
                @class-template-sync-push="session.pushClassTemplatesToSync"
              />
            </div>
          </details>

          <div class="grid gap-2 sm:grid-cols-2">
            <BaseButton :disabled="!classBuilderDraft.canLaunch" @click="session.startFreshSession">
              {{ session.startActionLabel.value }}
            </BaseButton>
            <BaseButton
              compact
              tone="subtle"
              :disabled="!classBuilderDraft.canLaunch"
              @click="session.createNewRandomSet"
            >
              <Shuffle class="fd-inline-icon-sm" aria-hidden="true" />
              {{ session.regenerateActionLabel.value }}
            </BaseButton>
          </div>
        </section>

        <div class="fd-workflow-nav">
          <BaseButton compact tone="subtle" :disabled="stepIndex === 0" @click="goToPreviousStep">
            <ArrowLeft class="fd-inline-icon-sm" aria-hidden="true" />
            Back
          </BaseButton>
          <BaseButton compact tone="subtle" :disabled="stepIndex === steps.length - 1" @click="goToNextStep">
            Next
            <ArrowRight class="fd-inline-icon-sm" aria-hidden="true" />
          </BaseButton>
        </div>
      </div>

      <aside class="fd-summary-rail fd-summary-rail-quiet">
        <section class="fd-subtle-card rounded-2xl p-4">
          <div class="grid gap-1">
            <p class="fd-section-label">Summary</p>
            <p class="fd-text-strong text-sm font-semibold">
              {{ classBuilderDraft.hasClassPlan ? "Class plan ready for review" : "Keep building the class plan" }}
            </p>
            <p class="fd-text-muted text-sm">{{ currentStepLabel }}</p>
          </div>
        </section>

        <section class="fd-card rounded-2xl p-4">
          <div class="fd-summary-metrics">
            <div>
              <p class="fd-kicker">Target</p>
              <p class="fd-text-strong text-sm font-semibold">{{ classBuilderDraft.classTargetMinutes }} min</p>
            </div>
            <div>
              <p class="fd-kicker">Planned</p>
              <p class="fd-text-strong text-sm font-semibold">{{ classBuilderDraft.classTotalMinutesText }}</p>
            </div>
            <div>
              <p class="fd-kicker">Poses</p>
              <p class="fd-text-strong text-sm font-semibold">{{ classBuilderDraft.classPoseCount }}</p>
            </div>
            <div>
              <p class="fd-kicker">Photos</p>
              <p class="fd-text-strong text-sm font-semibold">{{ session.taggedPhotos.value.length }}</p>
            </div>
          </div>
        </section>

        <section class="fd-subtle-card rounded-2xl p-4">
          <p class="fd-text-body text-sm">{{ classBuilderDraft.classDeltaText }}</p>
        </section>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { ArrowLeft, ArrowRight, Shuffle } from "lucide-vue-next";
import { useRoute, useRouter } from "vue-router";
import BaseButton from "../components/BaseButton.vue";
import SessionPreviewSection from "../components/SessionPreviewSection.vue";
import ClassBuilderAssistantSection from "../components/classDialog/ClassBuilderAssistantSection.vue";
import ClassPhotoSequenceSection from "../components/classDialog/ClassPhotoSequenceSection.vue";
import ClassPoseBlocksSection from "../components/classDialog/ClassPoseBlocksSection.vue";
import ClassPresetSection from "../components/classDialog/ClassPresetSection.vue";
import ClassTemplatesSection from "../components/classDialog/ClassTemplatesSection.vue";
import { useHostSessionContext } from "../composables/useHostSessionContext";

const router = useRouter();
const route = useRoute();
const { session, viewModels } = useHostSessionContext();
const classBuilderDraft = viewModels.classBuilderDraft;
const pageEyebrow = computed(() => String(route.meta.navLabel || "Class"));
const pageTitle = computed(() => String(route.meta.pageTitle || "Build the class in four steps."));
const pageDescription = computed(() =>
  String(
    route.meta.pageDescription ||
      "Set the target, shape the blocks, control the sequence, then launch from review."
  )
);
const steps = [
  { id: "target", label: "1", title: "Target" },
  { id: "blocks", label: "2", title: "Blocks" },
  { id: "sequence", label: "3", title: "Sequence" },
  { id: "review", label: "4", title: "Review" }
];
const currentStep = ref("target");

const stepIndex = computed(() => steps.findIndex((step) => step.id === currentStep.value));
const currentStepLabel = computed(() => {
  const activeStep = steps[stepIndex.value] || steps[0];
  return `${activeStep.label}. ${activeStep.title}`;
});

function goToPreviousStep() {
  currentStep.value = steps[Math.max(0, stepIndex.value - 1)].id;
}

function goToNextStep() {
  currentStep.value = steps[Math.min(steps.length - 1, stepIndex.value + 1)].id;
}

onMounted(() => {
  if (session.sessionMode.value !== "class") {
    session.setSessionMode("class");
  }
});
</script>
