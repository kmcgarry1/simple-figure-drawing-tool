<template>
  <div class="grid gap-3">
    <div class="grid gap-1">
      <p class="fd-section-label inline-flex items-center gap-1.5">
        <Shuffle class="h-4 w-4 fd-icon-accent" aria-hidden="true" />
        Photo Sequence
      </p>
      <p class="fd-text-strong text-sm font-semibold">Control how references are pulled into the class.</p>
      <p class="fd-text-muted text-sm">
        Shuffle is safer for variety. Upload order works better when the source pool was arranged on purpose.
      </p>
    </div>

    <div class="fd-segmented max-w-[420px]" role="group" aria-label="Photo order mode">
      <button
        type="button"
        class="fd-segmented-option"
        :class="{ 'is-active': classPhotoOrder === 'shuffle' }"
        :aria-pressed="classPhotoOrder === 'shuffle' ? 'true' : 'false'"
        @click="$emit('class-photo-order-change', 'shuffle')"
      >
        Shuffle Photos
      </button>
      <button
        type="button"
        class="fd-segmented-option"
        :class="{ 'is-active': classPhotoOrder === 'sequential' }"
        :aria-pressed="classPhotoOrder === 'sequential' ? 'true' : 'false'"
        @click="$emit('class-photo-order-change', 'sequential')"
      >
        Upload Order
      </button>
    </div>

    <label class="fd-check-inline" :class="{ 'opacity-60': classPhotoOrder === 'sequential' }">
      <input
        type="checkbox"
        class="fd-check-input"
        :checked="avoidImmediateRepeats"
        :disabled="classPhotoOrder === 'sequential'"
        @change="onRepeatToggle"
      />
      <span>Avoid back-to-back repeats while shuffling.</span>
    </label>

    <p class="fd-text-muted text-sm">
      This only changes photo order. The timing structure stays exactly as defined in the block list.
    </p>
  </div>
</template>

<script setup>
import { Shuffle } from "lucide-vue-next";

defineProps({
  classPhotoOrder: {
    type: String,
    required: true
  },
  avoidImmediateRepeats: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(["class-photo-order-change", "class-repeat-toggle"]);

function onRepeatToggle(event) {
  emit("class-repeat-toggle", event.target.checked);
}
</script>
