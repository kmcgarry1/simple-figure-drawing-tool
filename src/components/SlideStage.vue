<template>
  <section class="stage" aria-live="polite">
    <SlideTimerOverlay
      v-if="isSessionLive && currentSlideUrl"
      :slide-counter-text="slideCounterText"
      :time-left-text="timeLeftText"
      :timer-fill-percent="timerFillPercent"
    />

    <div class="image-wrap">
      <img v-if="currentSlideUrl" class="slide-image" :src="currentSlideUrl" :alt="currentSlideAlt" />
      <p v-else class="placeholder">{{ placeholderText }}</p>
    </div>
  </section>
</template>

<script setup>
import SlideTimerOverlay from "./SlideTimerOverlay.vue";

defineProps({
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
</script>
