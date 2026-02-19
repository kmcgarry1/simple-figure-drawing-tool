<template>
  <div class="timer-chip">
    <span class="timer-readout">{{ slideCounterText }} | {{ timeLeftText }}</span>
    <div class="timer-track">
      <span class="timer-fill" :style="{ width: `${timerFillPercent}%` }"></span>
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
  timerFillPercent: {
    type: Number,
    required: true
  }
});
</script>
