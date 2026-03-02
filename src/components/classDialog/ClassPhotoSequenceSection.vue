<template>
  <div class="grid gap-2.5">
    <p class="fd-section-label inline-flex items-center gap-1.5">
      <Shuffle class="h-4 w-4 text-sky-700" aria-hidden="true" />
      Photo Sequence
    </p>
    <p class="text-[12px] leading-5 text-stone-600">
      Decide whether the class runs in randomized order or follows upload sequence.
    </p>
    <div class="fd-segmented max-w-[380px]" role="group" aria-label="Photo order mode">
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
    <label class="inline-flex items-center gap-2 text-[12px] text-stone-700" :class="{ 'opacity-70': classPhotoOrder === 'sequential' }">
      <input
        type="checkbox"
        class="h-4 w-4 rounded border-amber-300/90 bg-white text-sky-500 focus-visible:ring-sky-300/80"
        :checked="avoidImmediateRepeats"
        :disabled="classPhotoOrder === 'sequential'"
        @change="onRepeatToggle"
      />
      <span>Avoid back-to-back repeats while shuffling.</span>
    </label>
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
