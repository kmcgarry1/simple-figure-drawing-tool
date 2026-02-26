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
  "inline-flex w-full items-center justify-center rounded-md border text-sm font-semibold tracking-[0.01em] transition-all duration-150 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-45 disabled:shadow-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

const sizeClass = computed(() => (props.compact ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2"));

const toneClass = computed(() => {
  if (props.tone === "danger") {
    return "border-rose-300/80 bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-[0_12px_24px_rgb(190_18_60_/_0.33)] hover:from-rose-400 hover:to-red-400 disabled:hover:from-rose-500 disabled:hover:to-red-500";
  }
  if (props.tone === "subtle") {
    return "border-cyan-300/25 bg-[linear-gradient(145deg,rgba(26,39,63,0.92),rgba(24,32,50,0.95))] text-slate-100 shadow-[0_10px_24px_rgb(2_6_23_/_0.35)] hover:border-cyan-300/40 hover:bg-[linear-gradient(145deg,rgba(30,48,75,0.95),rgba(28,40,65,0.95))] disabled:hover:border-cyan-300/25 disabled:hover:bg-[linear-gradient(145deg,rgba(26,39,63,0.92),rgba(24,32,50,0.95))]";
  }

  return "border-cyan-100/70 bg-gradient-to-br from-cyan-300 via-sky-300 to-emerald-300 text-slate-950 shadow-[0_12px_30px_rgb(34_211_238_/_0.34)] hover:from-cyan-200 hover:via-sky-200 hover:to-emerald-200 disabled:hover:from-cyan-300 disabled:hover:via-sky-300 disabled:hover:to-emerald-300";
});
</script>
