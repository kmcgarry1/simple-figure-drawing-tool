<template>
  <div class="grid gap-2.5">
    <p class="fd-section-label inline-flex items-center gap-1.5">
      <Timer class="h-4 w-4 text-sky-700" aria-hidden="true" />
      Class Length Preset
    </p>
    <p class="text-[12px] leading-5 text-stone-600">
      Choose a time target before fine-tuning blocks and sequence.
    </p>
    <div class="fd-subtle-card grid grid-cols-3 gap-2 rounded-lg p-2.5 max-[560px]:grid-cols-1">
      <BaseButton
        v-for="preset in classPresetOptions"
        :key="preset.id"
        compact
        :tone="presetTone(preset.id)"
        @click="$emit('class-preset-change', preset.id)"
      >
        {{ preset.label }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { Timer } from "lucide-vue-next";
import BaseButton from "../BaseButton.vue";

const props = defineProps({
  classPresetOptions: {
    type: Array,
    required: true
  },
  classPresetId: {
    type: String,
    required: true
  }
});

defineEmits(["class-preset-change"]);

function presetTone(presetId) {
  return props.classPresetId === presetId ? "primary" : "subtle";
}
</script>
