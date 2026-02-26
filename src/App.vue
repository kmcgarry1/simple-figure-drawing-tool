<template>
  <PhoneRemoteClientView
    v-if="isRemoteClientView"
    :remote-status="clientRemoteStatus"
    :answer-token="clientAnswerToken"
    :is-remote-connected="isClientRemoteConnected"
    @create-answer-token="createClientAnswerToken"
    @send-command="sendRemoteCommand"
    @disconnect="disconnectClientRemote"
  />

  <main v-else :class="shellClass">
    <AppHeader v-if="!isSessionLive" />

    <section :class="controlPanelClass">
      <SetupPanel
        v-if="!isSessionLive"
        :session-mode="sessionMode"
        :file-input-accept="fileInputAccept"
        :duration-seconds="durationSeconds"
        :class-preset-options="classPresetOptions"
        :class-preset-id="classPresetId"
        :class-blocks="classBlocks"
        :tagged-photos="taggedPhotos"
        :available-photo-tags="availablePhotoTags"
        :class-photo-order="classPhotoOrder"
        :avoid-immediate-repeats="avoidImmediateRepeats"
        :class-templates="classTemplates"
        :has-class-plan="hasClassPlan"
        :class-target-minutes="classTargetMinutes"
        :class-pose-count="classPoseCount"
        :class-total-minutes-text="classTotalMinutesText"
        :class-delta-text="classDeltaText"
        :start-action-label="startActionLabel"
        :regenerate-action-label="regenerateActionLabel"
        :has-source-photos="hasSourcePhotos"
        :session-history="sessionHistory"
        :status-message="statusMessage"
        :upload-notice="uploadNotice"
        @photos-selected="handlePhotoSelection"
        @session-mode-change="setSessionMode"
        @duration-input="updateDurationSeconds"
        @duration-change="applyDurationChange"
        @photo-tag-update="updatePhotoTag"
        @export-settings="exportSettingsJson"
        @import-settings="importSettingsFromFile"
        @class-preset-change="setClassPreset"
        @class-block-update="updateClassBlock"
        @class-block-add="addClassBlock"
        @class-block-remove="removeClassBlock"
        @class-photo-order-change="setClassPhotoOrder"
        @class-repeat-toggle="setAvoidImmediateRepeats"
        @class-template-save="saveClassTemplateByName"
        @class-template-load="loadClassTemplateById"
        @class-template-delete="deleteClassTemplateById"
        @start-session="startFreshSession"
        @new-random-set="createNewRandomSet"
        @clear-history="clearSessionHistory"
      />

      <LiveControlsPanel
        v-else
        :session-mode="sessionMode"
        :duration-seconds="durationSeconds"
        :mirror-live-view="mirrorLiveView"
        :grayscale-live-view="grayscaleLiveView"
        :hide-live-overlay="hideLiveOverlay"
        :is-running="isRunning"
        :is-paused="isPaused"
        :has-source-photos="hasSourcePhotos"
        :pause-label="pauseLabel"
        :restart-label="restartActionLabel"
        :remote-status="hostRemoteStatus"
        :remote-offer-token="hostOfferToken"
        :is-remote-connected="isHostRemoteConnected"
        @duration-input="updateDurationSeconds"
        @duration-change="applyDurationChange"
        @toggle-mirror-live-view="toggleMirrorLiveView"
        @toggle-grayscale-live-view="toggleGrayscaleLiveView"
        @toggle-hide-live-overlay="toggleHideLiveOverlay"
        @toggle-pause="togglePause"
        @next="goToNextSlide"
        @new-set="createNewRandomSet"
        @end="stopSession"
        @remote-create-offer="createHostOfferToken"
        @remote-apply-answer="applyHostAnswerToken"
        @remote-disconnect="disconnectHostRemote"
      />
    </section>

    <SlideStage
      :is-session-live="isSessionLive"
      :current-slide-url="currentSlideUrl"
      :current-slide-alt="currentSlideAlt"
      :placeholder-text="placeholderText"
      :slide-counter-text="slideCounterText"
      :time-left-text="timeLeftText"
      :active-pose-label="activePoseLabel"
      :session-time-left-text="sessionTimeLeftText"
      :timer-fill-percent="timerFillPercent"
      :mirror-live-view="mirrorLiveView"
      :grayscale-live-view="grayscaleLiveView"
      :hide-live-overlay="hideLiveOverlay"
    />
  </main>
</template>

<script setup>
import { computed } from "vue";
import AppHeader from "./components/AppHeader.vue";
import LiveControlsPanel from "./components/LiveControlsPanel.vue";
import PhoneRemoteClientView from "./components/PhoneRemoteClientView.vue";
import SetupPanel from "./components/SetupPanel.vue";
import SlideStage from "./components/SlideStage.vue";
import { usePhoneRemoteClient, usePhoneRemoteHost } from "./composables/usePhoneRemote";
import { useFigureSession } from "./composables/useFigureSession";
import { useLiveKeyboardShortcuts } from "./composables/useLiveKeyboardShortcuts";

const {
  fileInputAccept,
  sessionMode,
  durationSeconds,
  classPresetOptions,
  classPresetId,
  classBlocks,
  taggedPhotos,
  availablePhotoTags,
  classPhotoOrder,
  avoidImmediateRepeats,
  mirrorLiveView,
  grayscaleLiveView,
  hideLiveOverlay,
  classTemplates,
  hasClassPlan,
  classTargetMinutes,
  classPoseCount,
  classTotalMinutesText,
  classDeltaText,
  startActionLabel,
  regenerateActionLabel,
  restartActionLabel,
  sessionHistory,
  statusMessage,
  uploadNotice,
  currentSlideUrl,
  currentSlideAlt,
  activePoseLabel,
  sessionTimeLeftText,
  hasSourcePhotos,
  isRunning,
  isPaused,
  isSessionLive,
  pauseLabel,
  slideCounterText,
  timeLeftText,
  timerFillPercent,
  placeholderText,
  setSessionMode,
  setClassPreset,
  updateClassBlock,
  addClassBlock,
  removeClassBlock,
  setClassPhotoOrder,
  setAvoidImmediateRepeats,
  toggleMirrorLiveView,
  toggleGrayscaleLiveView,
  toggleHideLiveOverlay,
  exportSettingsJson,
  importSettingsFromFile,
  saveClassTemplateByName,
  loadClassTemplateById,
  deleteClassTemplateById,
  startFreshSession,
  togglePause,
  goToNextSlide,
  createNewRandomSet,
  clearSessionHistory,
  stopSession,
  applyDurationChange,
  updatePhotoTag,
  handlePhotoSelection
} = useFigureSession();

function updateDurationSeconds(value) {
  durationSeconds.value = value;
}

const isRemoteClientView =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("remote") === "1";

const {
  remoteStatus: hostRemoteStatus,
  offerToken: hostOfferToken,
  isRemoteConnected: isHostRemoteConnected,
  createOfferToken: createHostOfferToken,
  applyAnswerToken: applyHostAnswerToken,
  disconnectHostRemote
} = usePhoneRemoteHost({
  onTogglePause: togglePause,
  onNextSlide: goToNextSlide,
  onStopSession: stopSession
});

const {
  remoteStatus: clientRemoteStatus,
  answerToken: clientAnswerToken,
  isRemoteConnected: isClientRemoteConnected,
  createAnswerToken: createClientAnswerToken,
  sendRemoteCommand,
  disconnectClientRemote
} = usePhoneRemoteClient();

const shellClass = computed(() =>
  isSessionLive.value
    ? "relative min-h-dvh text-slate-100"
    : "mx-auto my-4 grid w-[min(980px,calc(100%-2rem))] gap-3 text-slate-100 max-[720px]:my-2 max-[720px]:w-[calc(100%-1rem)]"
);

const controlPanelClass = computed(() =>
  isSessionLive.value
    ? "fixed bottom-2 left-2 z-30 w-[min(360px,calc(100vw-1rem))] rounded-lg border border-slate-500/40 bg-slate-800/90 p-2 backdrop-blur"
    : "grid gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4 max-[720px]:rounded-lg"
);

if (!isRemoteClientView) {
  useLiveKeyboardShortcuts({
    isSessionLive,
    onTogglePause: togglePause,
    onNextSlide: goToNextSlide,
    onStopSession: stopSession
  });
}
</script>
