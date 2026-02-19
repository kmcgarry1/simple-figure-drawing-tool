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
  "inline-flex w-full items-center justify-center rounded-md border text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

const sizeClass = computed(() => (props.compact ? "px-2 py-1.5 text-xs" : "px-3 py-2"));

const toneClass = computed(() => {
  if (props.tone === "danger") {
    return "border-rose-500/60 bg-rose-600 text-white hover:bg-rose-500 disabled:hover:bg-rose-600";
  }
  if (props.tone === "subtle") {
    return "border-slate-600 bg-slate-700 text-slate-100 hover:bg-slate-600 disabled:hover:bg-slate-700";
  }

  return "border-sky-500/70 bg-sky-600 text-white hover:bg-sky-500 disabled:hover:bg-sky-600";
});
</script>
