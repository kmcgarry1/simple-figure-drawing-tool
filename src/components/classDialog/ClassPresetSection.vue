<template>
  <div class="grid gap-2">
    <p class="fd-section-label">Class Length Preset</p>
    <div class="grid grid-cols-3 gap-2 max-[560px]:grid-cols-1">
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
