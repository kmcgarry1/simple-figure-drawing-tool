<template>
  <Teleport to="body">
    <Transition appear name="dialog-fade">
      <div
        v-if="isOpen"
        class="fd-dialog-backdrop fixed inset-0 z-[90] grid place-items-center p-3"
        @click.self="$emit('close')"
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="class-launch-review-title"
          aria-describedby="class-launch-review-description"
          tabindex="-1"
          class="fd-modal-surface max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-xl p-4"
          @keydown.esc.prevent="$emit('close')"
        >
          <header class="mb-3 flex items-start justify-between gap-3">
            <div class="grid gap-1">
              <h2 id="class-launch-review-title" class="fd-title-gradient text-base font-semibold">
                Review Class Pose Grid
              </h2>
              <p id="class-launch-review-description" class="text-sm text-stone-600">
                Drag thumbnails to map photos to warm-up and long-pose durations before starting.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close class review dialog"
              class="rounded-md border border-amber-300/75 bg-white/78 px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              @click="$emit('close')"
            >
              Close
            </button>
          </header>

          <p class="mb-3 rounded-md border border-amber-200/80 bg-white/60 px-2.5 py-2 text-xs text-stone-600">
            Duration stays with each pose slot. Moving an image to a different slot applies that slot's timer.
          </p>

          <p v-if="slots.length === 0" class="rounded-md border border-amber-200/80 bg-white/56 px-2.5 py-2 text-sm text-stone-600">
            No class poses are prepared yet.
          </p>

          <div
            v-else
            class="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2"
          >
            <article
              v-for="(slot, index) in slots"
              :key="slot.id"
              draggable="true"
              class="grid gap-1.5 rounded-md border border-amber-200/80 bg-white/58 p-2 transition-shadow"
              :class="cardClass(index)"
              @dragstart="onDragStart(index, $event)"
              @dragover="onDragOver(index, $event)"
              @drop="onDrop(index, $event)"
              @dragend="resetDragState"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-semibold text-stone-800">Pose {{ slot.poseNumber }}</span>
                <span class="text-xs text-stone-500">{{ slot.durationText }}</span>
              </div>

              <img
                v-if="previewUrlsById[slot.id]"
                :src="previewUrlsById[slot.id]"
                :alt="`Pose ${slot.poseNumber}: ${slot.fileName}`"
                class="h-24 w-full rounded-md border border-amber-200/70 bg-stone-100 object-cover"
                loading="lazy"
              />
              <div
                v-else
                class="grid h-24 place-items-center rounded-md border border-dashed border-amber-200/80 bg-white/40 text-[11px] text-stone-500"
              >
                No preview
              </div>

              <p class="truncate text-xs text-stone-600">{{ slot.label }} | {{ slot.fileName }}</p>

              <div class="grid grid-cols-2 gap-1">
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

          <footer class="mt-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2">
            <BaseButton tone="subtle" @click="$emit('close')">Back to Setup</BaseButton>
            <BaseButton :disabled="slots.length === 0" @click="$emit('start-class')">Start Class</BaseButton>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from "vue";
import BaseButton from "./BaseButton.vue";

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

const dragSourceIndex = ref(-1);
const dragTargetIndex = ref(-1);
const previewUrlsById = ref({});

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

onBeforeUnmount(() => {
  clearPreviewUrls();
});

function cardClass(index) {
  return {
    "opacity-70 ring-2 ring-amber-300/70": index === dragSourceIndex.value,
    "ring-2 ring-sky-300/80": dragSourceIndex.value >= 0 && index === dragTargetIndex.value
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
