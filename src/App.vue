<template>
  <main class="app-shell" :class="{ 'session-live': isSessionLive }">
    <AppHeader v-if="!isSessionLive" />

    <section class="control-panel" :class="{ compact: isSessionLive }">
      <SetupPanel
        v-if="!isSessionLive"
        :file-input-accept="fileInputAccept"
        :duration-seconds="durationSeconds"
        :has-source-photos="hasSourcePhotos"
        :status-message="statusMessage"
        :upload-notice="uploadNotice"
        @photos-selected="handlePhotoSelection"
        @duration-input="updateDurationSeconds"
        @duration-change="applyDurationChange"
        @start-session="startFreshSession"
        @new-random-set="createNewRandomSet"
      />

      <LiveControlsPanel
        v-else
        :duration-seconds="durationSeconds"
        :is-running="isRunning"
        :has-source-photos="hasSourcePhotos"
        :pause-label="pauseLabel"
        @duration-input="updateDurationSeconds"
        @duration-change="applyDurationChange"
        @toggle-pause="togglePause"
        @next="goToNextSlide"
        @new-set="createNewRandomSet"
        @end="stopSession"
      />
    </section>

    <SlideStage
      :is-session-live="isSessionLive"
      :current-slide-url="currentSlideUrl"
      :current-slide-alt="currentSlideAlt"
      :placeholder-text="placeholderText"
      :slide-counter-text="slideCounterText"
      :time-left-text="timeLeftText"
      :timer-fill-percent="timerFillPercent"
    />
  </main>
</template>

<script setup>
import AppHeader from "./components/AppHeader.vue";
import LiveControlsPanel from "./components/LiveControlsPanel.vue";
import SetupPanel from "./components/SetupPanel.vue";
import SlideStage from "./components/SlideStage.vue";
import { useFigureSession } from "./composables/useFigureSession";
import { useLiveKeyboardShortcuts } from "./composables/useLiveKeyboardShortcuts";

const {
  fileInputAccept,
  durationSeconds,
  statusMessage,
  uploadNotice,
  currentSlideUrl,
  currentSlideAlt,
  hasSourcePhotos,
  isRunning,
  isSessionLive,
  pauseLabel,
  slideCounterText,
  timeLeftText,
  timerFillPercent,
  placeholderText,
  startFreshSession,
  togglePause,
  goToNextSlide,
  createNewRandomSet,
  stopSession,
  applyDurationChange,
  handlePhotoSelection
} = useFigureSession();

function updateDurationSeconds(value) {
  durationSeconds.value = value;
}

useLiveKeyboardShortcuts({
  isSessionLive,
  onTogglePause: togglePause,
  onNextSlide: goToNextSlide,
  onStopSession: stopSession
});
</script>
