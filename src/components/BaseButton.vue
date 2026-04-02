<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[baseClass, sizeClass, toneClass]"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  type: {
    type: String,
    default: "button"
  },
  disabled: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: false
  },
  tone: {
    type: String,
    default: "primary"
  }
});

defineEmits(["click"]);

const baseClass =
  "inline-flex w-full items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold tracking-[0.01em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--fd-accent)/0.28)]";

const sizeClass = computed(() => (props.compact ? "px-3 py-2 text-xs" : "px-4 py-3"));

const toneClass = computed(() => {
  if (props.tone === "danger") {
    return "fd-button-danger";
  }
  if (props.tone === "subtle") {
    return "fd-button-subtle";
  }

  return "fd-button-primary";
});
</script>
