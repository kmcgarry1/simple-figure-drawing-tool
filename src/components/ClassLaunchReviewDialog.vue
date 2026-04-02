<template>
  <Teleport to="body">
    <Transition appear name="dialog-fade">
      <div
        v-if="isOpen"
        class="fd-dialog-backdrop"
        @click.self="$emit('close')"
      >
        <section
          ref="dialogRef"
          role="dialog"
          aria-modal="true"
          aria-labelledby="class-launch-review-title"
          aria-describedby="class-launch-review-description"
          tabindex="-1"
          class="fd-modal-surface fd-dialog-panel"
          @keydown="onDialogKeydown"
        >
          <header class="fd-sheet-header">
            <div class="grid gap-1">
              <p class="fd-section-label">Review</p>
              <h2 id="class-launch-review-title" class="fd-sheet-title">Review Class Pose Grid</h2>
              <p id="class-launch-review-description" class="fd-text-muted text-sm">
                Drag thumbnails to remap images before launch. Each slot keeps its own duration.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close class review dialog"
              class="fd-topbar-button fd-topbar-button-quiet"
              @click="$emit('close')"
            >
              Close
            </button>
          </header>

          <section class="fd-callout rounded-2xl p-4">
            <p class="fd-text-body text-sm">
              Moving an image to a new slot changes the timer attached to that image. Review the order before you start.
            </p>
          </section>

          <p v-if="slots.length === 0" class="fd-inline-note">
            <span class="fd-text-strong text-sm font-semibold">No class poses are prepared yet.</span>
          </p>

          <div
            v-else
            class="fd-review-grid"
          >
            <article
              v-for="(slot, index) in slots"
              :key="slot.id"
              draggable="true"
              class="fd-review-slot"
              :class="cardClass(index)"
              @dragstart="onDragStart(index, $event)"
              @dragover="onDragOver(index, $event)"
              @drop="onDrop(index, $event)"
              @dragend="resetDragState"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="fd-text-strong text-sm font-semibold">Pose {{ slot.poseNumber }}</span>
                <span class="fd-text-muted text-sm">{{ slot.durationText }}</span>
              </div>

              <img
                v-if="previewUrlsById[slot.id]"
                :src="previewUrlsById[slot.id]"
                :alt="`Pose ${slot.poseNumber}: ${slot.fileName}`"
                class="fd-review-slot-media"
                loading="lazy"
              />
              <div
                v-else
                class="fd-review-slot-empty"
              >
                No preview
              </div>

              <p class="truncate fd-text-muted text-sm">{{ slot.label }} | {{ slot.fileName }}</p>

              <div class="grid grid-cols-2 gap-2">
                <BaseButton
                  compact
                  tone="subtle"
                  :disabled="index === 0"
                  @click="requestMove(index, index - 1)"
                >
                  Earlier
                </BaseButton>
                <BaseButton
                  compact
                  tone="subtle"
                  :disabled="index >= slots.length - 1"
                  @click="requestMove(index, index + 1)"
                >
                  Later
                </BaseButton>
              </div>
            </article>
          </div>

          <footer class="grid gap-2 sm:grid-cols-2">
            <BaseButton tone="subtle" @click="$emit('close')">Back To Setup</BaseButton>
            <BaseButton :disabled="slots.length === 0" @click="$emit('start-class')">Start Class</BaseButton>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import BaseButton from "./BaseButton.vue";

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
  slots: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(["close", "reorder", "start-class"]);

const dialogRef = ref(null);
const dragSourceIndex = ref(-1);
const dragTargetIndex = ref(-1);
const previewUrlsById = ref({});
const previousFocusedElement = ref(null);

function clearPreviewUrls() {
  for (const url of Object.values(previewUrlsById.value)) {
    URL.revokeObjectURL(url);
  }
  previewUrlsById.value = {};
}

function rebuildPreviewUrls() {
  clearPreviewUrls();

  const nextPreviewUrlsById = {};
  for (const slot of props.slots) {
    if (!slot?.file) {
      continue;
    }
    nextPreviewUrlsById[slot.id] = URL.createObjectURL(slot.file);
  }
  previewUrlsById.value = nextPreviewUrlsById;
}

watch(
  () => props.slots,
  () => {
    rebuildPreviewUrls();
  },
  {
    immediate: true,
    deep: true
  }
);

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

onBeforeUnmount(() => {
  clearPreviewUrls();
  document.body.style.overflow = "";
});

function cardClass(index) {
  return {
    "is-dragging": index === dragSourceIndex.value,
    "is-drop-target": dragSourceIndex.value >= 0 && index === dragTargetIndex.value
  };
}

function resetDragState() {
  dragSourceIndex.value = -1;
  dragTargetIndex.value = -1;
}

function requestMove(fromIndex, toIndex) {
  if (
    !Number.isInteger(fromIndex) ||
    !Number.isInteger(toIndex) ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= props.slots.length ||
    toIndex >= props.slots.length ||
    fromIndex === toIndex
  ) {
    return;
  }

  emit("reorder", { fromIndex, toIndex });
}

function onDragStart(index, event) {
  dragSourceIndex.value = index;
  dragTargetIndex.value = index;

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }
}

function onDragOver(index, event) {
  event.preventDefault();
  dragTargetIndex.value = index;

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

function onDrop(index, event) {
  event.preventDefault();

  const transferIndex = Number.parseInt(
    String(event.dataTransfer?.getData("text/plain") || ""),
    10
  );
  const fromIndex =
    dragSourceIndex.value >= 0 ? dragSourceIndex.value : transferIndex;

  requestMove(fromIndex, index);
  resetDragState();
}

function onDialogKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    emit("close");
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusables = Array.from(dialogRef.value?.querySelectorAll(FOCUSABLE_SELECTOR) || []).filter(
    (element) => element instanceof HTMLElement && element.getClientRects().length > 0
  );

  if (focusables.length === 0) {
    event.preventDefault();
    dialogRef.value?.focus();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
</script>
