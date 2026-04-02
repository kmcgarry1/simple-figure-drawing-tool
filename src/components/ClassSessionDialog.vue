<template>
  <Teleport to="body">
    <Transition appear name="dialog-fade">
      <div
        v-if="isOpen"
        class="fd-dialog-backdrop fixed inset-0 z-[80] grid place-items-center p-3"
        @click.self="closeDialog"
      >
        <section
          ref="dialogRef"
          role="dialog"
          aria-modal="true"
          aria-labelledby="class-dialog-title"
          aria-describedby="class-dialog-description"
          tabindex="-1"
          class="fd-modal-surface max-h-[92dvh] w-full max-w-6xl overflow-y-auto rounded-[1.7rem] p-5 max-[720px]:rounded-xl max-[720px]:p-4"
          @keydown="onDialogKeydown"
        >
          <header class="mb-4 grid gap-3">
            <div class="flex items-start justify-between gap-3">
              <div class="grid gap-1">
                <p class="fd-section-label">Class Planner</p>
                <h2 id="class-dialog-title" class="fd-title-gradient text-[1.18rem] font-semibold">
                  Build the class as one sequence.
                </h2>
                <p id="class-dialog-description" class="fd-text-muted max-w-[62ch] text-sm leading-6">
                  Set the class target, shape the blocks, control photo order, and launch from a single planning surface.
                </p>
              </div>
              <BaseButton compact tone="subtle" @click="closeDialog">Close</BaseButton>
            </div>

            <section class="fd-callout grid gap-3 rounded-[1.3rem] p-3.5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
              <div class="grid gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="fd-chip rounded-full px-2.5 py-1 text-[11px] font-semibold">1. Target</span>
                  <span class="fd-chip rounded-full px-2.5 py-1 text-[11px] font-semibold">2. Blocks</span>
                  <span class="fd-chip rounded-full px-2.5 py-1 text-[11px] font-semibold">3. Sequence</span>
                  <span class="fd-chip rounded-full px-2.5 py-1 text-[11px] font-semibold">4. Launch</span>
                </div>
                <p class="fd-text-body text-sm leading-6">
                  Build the timing model first, then refine the sequence only where it affects the final run.
                </p>
              </div>
              <div class="grid gap-2 sm:grid-cols-3 lg:grid-cols-3">
                <article class="fd-subtle-card grid gap-0.5 rounded-xl px-3 py-2.5">
                  <p class="fd-kicker">Target</p>
                  <p class="fd-text-strong text-sm font-semibold">{{ classTargetMinutes }} min</p>
                </article>
                <article class="fd-subtle-card grid gap-0.5 rounded-xl px-3 py-2.5">
                  <p class="fd-kicker">Planned</p>
                  <p class="fd-text-strong text-sm font-semibold">{{ classTotalMinutesText }}</p>
                </article>
                <article class="fd-subtle-card grid gap-0.5 rounded-xl px-3 py-2.5">
                  <p class="fd-kicker">Pose Count</p>
                  <p class="fd-text-strong text-sm font-semibold">{{ classPoseCount }}</p>
                </article>
              </div>
            </section>
          </header>

          <div class="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.82fr)] xl:items-start">
            <div class="grid gap-4">
              <section class="grid gap-4 lg:grid-cols-2">
                <div class="fd-card grid gap-3 rounded-[1.3rem] p-3.5">
                  <ClassPresetSection
                    :class-preset-options="classPresetOptions"
                    :class-preset-id="classPresetId"
                    @class-preset-change="$emit('class-preset-change', $event)"
                  />
                </div>

                <div class="fd-card grid gap-3 rounded-[1.3rem] p-3.5">
                  <ClassBuilderAssistantSection
                    :class-preset-options="classPresetOptions"
                    :class-preset-id="classPresetId"
                    :available-photo-tags="availablePhotoTags"
                    @class-assistant-generate="$emit('class-assistant-generate', $event)"
                  />
                </div>
              </section>

              <section class="fd-card grid gap-3 rounded-[1.3rem] p-3.5">
                <div class="grid gap-1">
                  <p class="fd-section-label">Structure</p>
                  <p class="fd-text-strong text-base font-semibold">Edit the class blocks inline</p>
                  <p class="fd-text-muted text-[13px] leading-5">
                    Keep the whole sequence visible so changes to timing, labels, and tags are easier to understand.
                  </p>
                </div>

                <ClassPoseBlocksSection
                  :class-blocks="classBlocks"
                  :available-photo-tags="availablePhotoTags"
                  @class-block-update="$emit('class-block-update', $event)"
                  @class-block-add="$emit('class-block-add', $event)"
                  @class-block-remove="$emit('class-block-remove', $event)"
                />
              </section>

              <section class="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <div class="fd-card grid gap-3 rounded-[1.3rem] p-3.5">
                  <ClassPhotoSequenceSection
                    :class-photo-order="classPhotoOrder"
                    :avoid-immediate-repeats="avoidImmediateRepeats"
                    @class-photo-order-change="$emit('class-photo-order-change', $event)"
                    @class-repeat-toggle="$emit('class-repeat-toggle', $event)"
                  />
                </div>

                <div class="fd-card grid gap-3 rounded-[1.3rem] p-3.5">
                  <ClassTemplatesSection
                    :class-templates="classTemplates"
                    :class-template-sync-enabled="classTemplateSyncEnabled"
                    :class-template-sync-key="classTemplateSyncKey"
                    @class-template-save="$emit('class-template-save', $event)"
                    @class-template-load="$emit('class-template-load', $event)"
                    @class-template-delete="$emit('class-template-delete', $event)"
                    @class-template-rename="$emit('class-template-rename', $event)"
                    @class-template-duplicate="$emit('class-template-duplicate', $event)"
                    @class-template-export="$emit('class-template-export')"
                    @class-template-import="$emit('class-template-import', $event)"
                    @class-template-sync-key-change="$emit('class-template-sync-key-change', $event)"
                    @class-template-sync-pull="$emit('class-template-sync-pull')"
                    @class-template-sync-push="$emit('class-template-sync-push')"
                  />
                </div>
              </section>
            </div>

            <aside class="grid gap-3 xl:sticky xl:top-2">
              <section class="fd-callout grid gap-2.5 rounded-[1.3rem] p-3.5">
                <div class="flex items-center justify-between gap-2">
                  <div class="grid gap-0.5">
                    <p class="fd-section-label">Launch Readiness</p>
                    <p class="fd-text-strong text-sm font-semibold">
                      {{ hasClassPlan ? "Class plan ready to launch" : "Add at least one usable block" }}
                    </p>
                  </div>
                  <span :class="readinessBadgeClass">{{ readinessBadgeLabel }}</span>
                </div>
                <div class="grid gap-1 text-sm">
                  <p class="fd-text-body">
                    Plan total: <span class="font-semibold">{{ classTotalMinutesText }}</span>
                  </p>
                  <p class="fd-text-body">
                    Preset target: <span class="font-semibold">{{ classTargetMinutes }} minutes</span>
                  </p>
                  <p class="fd-text-caption">{{ classDeltaText }}</p>
                </div>
              </section>

              <SessionPreviewSection
                :preview-items="sessionPreviewItems"
                :preview-summary-text="sessionPreviewSummaryText"
              />

              <section class="fd-card grid gap-2 rounded-[1.3rem] p-3.5">
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
              </section>
            </aside>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import BaseButton from "./BaseButton.vue";
import SessionPreviewSection from "./SessionPreviewSection.vue";
import ClassBuilderAssistantSection from "./classDialog/ClassBuilderAssistantSection.vue";
import ClassPhotoSequenceSection from "./classDialog/ClassPhotoSequenceSection.vue";
import ClassPoseBlocksSection from "./classDialog/ClassPoseBlocksSection.vue";
import ClassPresetSection from "./classDialog/ClassPresetSection.vue";
import ClassTemplatesSection from "./classDialog/ClassTemplatesSection.vue";

const FOCUSABLE_SELECTOR = [
  "a[href]:not([tabindex='-1'])",
  "button:not([disabled]):not([tabindex='-1'])",
  "input:not([disabled]):not([type='hidden']):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

const props = defineProps({
  isOpen: {
    type: Boolean,
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
  classTemplateSyncEnabled: {
    type: Boolean,
    required: true
  },
  classTemplateSyncKey: {
    type: String,
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
  sessionPreviewItems: {
    type: Array,
    required: true
  },
  sessionPreviewSummaryText: {
    type: String,
    required: true
  }
});

const emit = defineEmits([
  "close",
  "class-preset-change",
  "class-block-update",
  "class-block-add",
  "class-block-remove",
  "class-assistant-generate",
  "class-photo-order-change",
  "class-repeat-toggle",
  "class-template-save",
  "class-template-load",
  "class-template-delete",
  "class-template-rename",
  "class-template-duplicate",
  "class-template-export",
  "class-template-import",
  "class-template-sync-key-change",
  "class-template-sync-pull",
  "class-template-sync-push",
  "start-session",
  "new-random-set"
]);

const readinessBadgeLabel = computed(() => (props.hasClassPlan ? "Ready" : "Needs Plan"));
const readinessBadgeClass = computed(() =>
  props.hasClassPlan
    ? "fd-badge-success rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
    : "fd-badge-locked rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
);

const dialogRef = ref(null);
const previousFocusedElement = ref(null);

watch(
  () => props.isOpen,
  async (nextOpen) => {
    if (nextOpen) {
      previousFocusedElement.value =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      document.body.style.overflow = "hidden";
      await nextTick();
      dialogRef.value?.focus();
      return;
    }

    document.body.style.overflow = "";
    await nextTick();
    previousFocusedElement.value?.focus();
  }
);

function closeDialog() {
  emit("close");
}

function onDialogKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeDialog();
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusables = Array.from(
    dialogRef.value?.querySelectorAll(FOCUSABLE_SELECTOR) || []
  ).filter(
    (element) => element instanceof HTMLElement && element.getClientRects().length > 0
  );

  if (focusables.length === 0) {
    event.preventDefault();
    dialogRef.value?.focus();
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

onBeforeUnmount(() => {
  document.body.style.overflow = "";
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
