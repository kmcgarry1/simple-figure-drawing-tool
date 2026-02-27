<template>
  <div class="grid gap-2">
    <p class="fd-section-label">Photo Sequence</p>
    <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
      <BaseButton compact :tone="photoOrderTone('shuffle')" @click="$emit('class-photo-order-change', 'shuffle')">
        Shuffle Photos
      </BaseButton>
      <BaseButton
        compact
        :tone="photoOrderTone('sequential')"
        @click="$emit('class-photo-order-change', 'sequential')"
      >
        Upload Order
      </BaseButton>
    </div>
    <label class="inline-flex items-center gap-2 text-sm text-stone-600">
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
import BaseButton from "../BaseButton.vue";

const props = defineProps({
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

function photoOrderTone(order) {
  return props.classPhotoOrder === order ? "primary" : "subtle";
}

function onRepeatToggle(event) {
  emit("class-repeat-toggle", event.target.checked);
}
</script>
