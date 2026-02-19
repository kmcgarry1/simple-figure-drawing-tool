<template>
  <section :class="stageClass" aria-live="polite">
    <SlideTimerOverlay
      v-if="isSessionLive && currentSlideUrl"
      :slide-counter-text="slideCounterText"
      :time-left-text="timeLeftText"
      :timer-fill-percent="timerFillPercent"
    />

    <div :class="imageWrapClass">
      <img v-if="currentSlideUrl" :class="imageClass" :src="currentSlideUrl" :alt="currentSlideAlt" />
      <p v-else class="m-4 text-center text-sm text-slate-400">{{ placeholderText }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import SlideTimerOverlay from "./SlideTimerOverlay.vue";

const props = defineProps({
  isSessionLive: {
    type: Boolean,
    required: true
  },
  currentSlideUrl: {
    type: String,
    default: ""
  },
  currentSlideAlt: {
    type: String,
    default: ""
  },
  placeholderText: {
    type: String,
    required: true
  },
  slideCounterText: {
    type: String,
    required: true
  },
  timeLeftText: {
    type: String,
    required: true
  },
  timerFillPercent: {
    type: Number,
    required: true
  }
});

const stageClass = computed(() =>
  props.isSessionLive
    ? "fixed inset-0 z-10 h-dvh w-screen overflow-hidden bg-black"
    : "relative overflow-hidden rounded-xl border border-slate-700 bg-slate-900 max-[720px]:rounded-lg"
);

const imageWrapClass = computed(() =>
  props.isSessionLive
    ? "absolute inset-0 grid h-dvh min-h-dvh w-screen place-items-center bg-black"
    : "grid h-[min(72vh,760px)] min-h-[min(72vh,760px)] w-full place-items-center bg-zinc-950 max-[720px]:h-[58vh] max-[720px]:min-h-[58vh]"
);

const imageClass = computed(() =>
  props.isSessionLive
    ? "block h-auto w-auto max-h-dvh max-w-screen object-contain object-center [image-orientation:from-image]"
    : "block h-auto w-auto max-h-full max-w-full object-contain object-center [image-orientation:from-image]"
);
</script>
