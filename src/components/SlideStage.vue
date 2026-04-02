<template>
  <section :class="stageClass" aria-live="polite">
    <SlideTimerOverlay
      v-if="isSessionLive && currentSlideUrl && !hideLiveOverlay"
      :slide-counter-text="slideCounterText"
      :time-left-text="timeLeftText"
      :active-pose-label="activePoseLabel"
      :session-time-left-text="sessionTimeLeftText"
      :timer-fill-percent="timerFillPercent"
    />

    <div :class="imageWrapClass">
      <Transition name="stage-media" mode="out-in">
        <img
          v-if="currentSlideUrl"
          :key="currentSlideUrl"
          :class="imageClass"
          :style="imageFilterStyle"
          :src="currentSlideUrl"
          :alt="currentSlideAlt"
        />
        <p v-else key="stage-placeholder" class="fd-text-muted m-4 text-center text-sm">
          {{ placeholderText }}
        </p>
      </Transition>
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
  },
  mirrorLiveView: {
    type: Boolean,
    required: true
  },
  grayscaleLiveView: {
    type: Boolean,
    required: true
  },
  hideLiveOverlay: {
    type: Boolean,
    required: true
  }
});

const stageClass = computed(() =>
  props.isSessionLive
    ? "fixed inset-0 z-10 h-dvh w-screen overflow-hidden bg-black"
    : "surface-panel relative overflow-hidden rounded-[1.2rem] max-[720px]:rounded-xl xl:sticky xl:top-4"
);

const imageWrapClass = computed(() =>
  props.isSessionLive
    ? "absolute inset-0 grid h-dvh min-h-dvh w-screen place-items-center bg-black"
    : "fd-stage-placeholder grid h-[min(72vh,760px)] min-h-[min(72vh,760px)] w-full place-items-center rounded-[1.15rem] max-[720px]:h-[58vh] max-[720px]:min-h-[58vh]"
);

const imageClass = computed(() =>
  props.isSessionLive
    ? "block h-auto w-auto max-h-dvh max-w-screen object-contain object-center [image-orientation:from-image]"
    : "block h-auto w-auto max-h-full max-w-full object-contain object-center [image-orientation:from-image]"
);

const imageFilterStyle = computed(() => {
  if (!props.isSessionLive) {
    return {};
  }

  const transforms = [];
  if (props.mirrorLiveView) {
    transforms.push("scaleX(-1)");
  }

  return {
    transform: transforms.length > 0 ? transforms.join(" ") : "none",
    filter: props.grayscaleLiveView ? "grayscale(1)" : "none"
  };
});
</script>

<style scoped>
.stage-media-enter-active,
.stage-media-leave-active {
  transition:
    opacity var(--fd-motion-slow) var(--fd-ease-standard),
    transform var(--fd-motion-slow) var(--fd-ease-snappy),
    filter var(--fd-motion-slow) var(--fd-ease-standard);
}

.stage-media-enter-from,
.stage-media-leave-to {
  opacity: 0;
  transform: scale(0.992);
  filter: blur(1.2px);
}

@media (prefers-reduced-motion: reduce) {
  .stage-media-enter-active,
  .stage-media-leave-active {
    transition: none;
  }
}
</style>
