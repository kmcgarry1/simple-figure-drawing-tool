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
  "inline-flex w-full items-center justify-center rounded-md border text-sm font-semibold tracking-wide transition-all duration-150 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-45 disabled:shadow-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

const sizeClass = computed(() => (props.compact ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2"));

const toneClass = computed(() => {
  if (props.tone === "danger") {
    return "border-rose-400/80 bg-rose-500 text-white shadow-[0_10px_24px_rgb(190_18_60_/_0.26)] hover:bg-rose-400 disabled:hover:bg-rose-500";
  }
  if (props.tone === "subtle") {
    return "border-slate-500/70 bg-slate-700/90 text-slate-100 shadow-[0_8px_20px_rgb(15_23_42_/_0.28)] hover:bg-slate-600/95 disabled:hover:bg-slate-700/90";
  }

  return "border-teal-200/60 bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-950 shadow-[0_10px_24px_rgb(45_212_191_/_0.24)] hover:from-teal-300 hover:to-cyan-400 disabled:hover:from-teal-400 disabled:hover:to-cyan-500";
});
</script>
