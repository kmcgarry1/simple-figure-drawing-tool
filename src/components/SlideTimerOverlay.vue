<template>
  <div
    class="fd-overlay-chip pointer-events-none absolute left-2.5 right-2.5 top-2.5 z-20 rounded-xl px-2.5 py-2 md:left-auto md:w-[min(420px,calc(100%-1.25rem))]"
  >
    <div class="grid gap-2">
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="fd-overlay-pill">
          <Images class="h-3.5 w-3.5" aria-hidden="true" />
          {{ slideCounterText }}
        </span>
        <span class="fd-overlay-pill">
          <Clock3 class="h-3.5 w-3.5" aria-hidden="true" />
          {{ timeLeftText }}
        </span>
        <span class="fd-overlay-pill">
          <Hourglass class="h-3.5 w-3.5" aria-hidden="true" />
          Session {{ sessionTimeLeftText }} left
        </span>
      </div>

      <p class="inline-flex items-center gap-1.5 truncate text-[12px] font-semibold text-slate-100/95">
        <Image class="h-3.5 w-3.5" aria-hidden="true" />
        {{ activePoseLabel }}
      </p>

      <div class="h-1 overflow-hidden rounded-full bg-white/22">
        <span
          class="block h-full bg-gradient-to-r from-sky-200 via-lime-200 to-amber-200 transition-[width] duration-100"
          :style="{ width: `${overlayProgressPercent}%` }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { Clock3, Hourglass, Image, Images } from "lucide-vue-next";

const props = defineProps({
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

const overlayProgressPercent = computed(() => {
  const numericPercent = Number.isFinite(props.timerFillPercent) ? props.timerFillPercent : 0;
  return Math.max(0, Math.min(100, numericPercent));
});
</script>
