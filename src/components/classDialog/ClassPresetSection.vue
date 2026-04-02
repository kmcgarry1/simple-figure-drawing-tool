<template>
  <div class="grid gap-3">
    <div class="grid gap-1">
      <p class="fd-section-label inline-flex items-center gap-2">
        <Timer class="h-4 w-4 fd-icon-accent" aria-hidden="true" />
        Class Length Preset
      </p>
      <p class="fd-text-muted text-sm">
        Choose a time target before fine-tuning the timing structure and sequence.
      </p>
    </div>

    <div class="fd-choice-grid fd-choice-grid-3">
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
