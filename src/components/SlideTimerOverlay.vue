<template>
  <div
    class="pointer-events-none absolute right-2.5 top-2.5 z-20 min-w-[150px] max-w-[240px] rounded-md border border-slate-500/40 bg-black/65 px-2 py-1"
  >
    <span class="block text-[11px] leading-tight text-slate-200"
      >{{ slideCounterText }} | {{ timeLeftText }}</span
    >
    <span class="block truncate text-[11px] leading-tight text-slate-300"
      >{{ activePoseLabel }} | Session {{ sessionTimeLeftText }} left</span
    >
    <div class="mt-1 h-0.5 overflow-hidden rounded-full bg-slate-500/40">
      <span class="block h-full bg-sky-300 transition-[width] duration-100" :style="{ width: `${timerFillPercent}%` }"></span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  slideCounterText: {
    type: String,
    required: true
  },
  timeLeftText: {
    type: String,
    required: true
  },
  activePoseLabel: {
    type: String,
    required: true
  },
  sessionTimeLeftText: {
    type: String,
    required: true
  },
  timerFillPercent: {
    type: Number,
    required: true
  }
});
</script>
