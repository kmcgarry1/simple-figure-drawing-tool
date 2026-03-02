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
          class="fd-modal-surface max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-2xl p-4"
          @keydown="onDialogKeydown"
        >
          <header class="mb-3 flex items-start justify-between gap-3">
            <div class="grid gap-1">
              <h2 id="class-dialog-title" class="fd-title-gradient text-[1.08rem] font-semibold">
                Life Drawing Class Wizard
              </h2>
              <p id="class-dialog-description" class="text-sm text-stone-600">
                Build your class plan and launch from this dialog.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close class wizard dialog"
              class="rounded-lg border border-amber-300/75 bg-white/82 px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              @click="closeDialog"
            >
              Close
            </button>
          </header>

          <div class="grid gap-3">
            <ClassPresetSection
              :class-preset-options="classPresetOptions"
              :class-preset-id="classPresetId"
              @class-preset-change="$emit('class-preset-change', $event)"
            />

            <ClassBuilderAssistantSection
              :class-preset-options="classPresetOptions"
              :class-preset-id="classPresetId"
              :available-photo-tags="availablePhotoTags"
              @class-assistant-generate="$emit('class-assistant-generate', $event)"
            />

            <ClassPoseBlocksSection
              :class-blocks="classBlocks"
              :available-photo-tags="availablePhotoTags"
              @class-block-update="$emit('class-block-update', $event)"
              @class-block-add="$emit('class-block-add', $event)"
              @class-block-remove="$emit('class-block-remove', $event)"
            />

            <ClassPhotoSequenceSection
              :class-photo-order="classPhotoOrder"
              :avoid-immediate-repeats="avoidImmediateRepeats"
              @class-photo-order-change="$emit('class-photo-order-change', $event)"
              @class-repeat-toggle="$emit('class-repeat-toggle', $event)"
            />

            <ClassTemplatesSection
              :class-templates="classTemplates"
              @class-template-save="$emit('class-template-save', $event)"
              @class-template-load="$emit('class-template-load', $event)"
              @class-template-delete="$emit('class-template-delete', $event)"
              @class-template-rename="$emit('class-template-rename', $event)"
              @class-template-duplicate="$emit('class-template-duplicate', $event)"
              @class-template-export="$emit('class-template-export')"
              @class-template-import="$emit('class-template-import', $event)"
            />

            <div class="grid gap-1 rounded-lg border border-amber-200/80 bg-white/82 px-2.5 py-2 text-sm text-stone-600">
              <p>
                Plan total:
                <span class="font-semibold text-stone-800">{{ classTotalMinutesText }}</span>
                across {{ classPoseCount }} poses.
              </p>
              <p>Preset target: {{ classTargetMinutes }} minutes ({{ classDeltaText }}).</p>
            </div>

            <SessionPreviewSection
              :preview-items="sessionPreviewItems"
              :preview-summary-text="sessionPreviewSummaryText"
            />

            <div class="sticky bottom-0 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2 rounded-lg border border-amber-200/70 bg-white/92 p-2">
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
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
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
  "start-session",
  "new-random-set"
]);

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
