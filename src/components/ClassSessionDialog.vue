<template>
  <Teleport to="body">
    <Transition appear name="dialog-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[80] grid place-items-center bg-slate-950/75 p-3 backdrop-blur-[2px]"
        @click.self="closeDialog"
      >
        <section
          ref="dialogRef"
          role="dialog"
          aria-modal="true"
          aria-labelledby="class-dialog-title"
          aria-describedby="class-dialog-description"
          tabindex="-1"
          class="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 p-4 shadow-2xl"
          @keydown="onDialogKeydown"
        >
          <header class="mb-3 flex items-start justify-between gap-3">
            <div class="grid gap-1">
              <h2 id="class-dialog-title" class="text-base font-semibold text-slate-100">
                Life Drawing Class Wizard
              </h2>
              <p id="class-dialog-description" class="text-sm text-slate-300">
                Build your class plan and launch from this dialog.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close class wizard dialog"
              class="rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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

            <ClassPoseBlocksSection
              :class-blocks="classBlocks"
              :available-photo-tags="availablePhotoTags"
              @class-block-update="$emit('class-block-update', $event)"
              @class-block-add="$emit('class-block-add')"
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
            />

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
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import BaseButton from "./BaseButton.vue";
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
  }
});

const emit = defineEmits([
  "close",
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
