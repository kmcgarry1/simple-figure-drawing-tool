<template>
  <main :class="shellClass">
    <AppHeader
      v-if="!isSessionLive"
      :theme-mode="themeMode"
      @toggle-theme="toggleThemeMode"
    />

    <section :class="workspaceClass">
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
          :settings-save-status-text="settingsSaveStatusText"
          :session-preview-items="sessionPreviewItems"
          :session-preview-summary-text="sessionPreviewSummaryText"
          @photos-selected="handlePhotoSelection"
          @session-mode-change="setSessionMode"
          @duration-input="updateDurationSeconds"
          @duration-change="applyDurationChange"
          @photo-tag-update="updatePhotoTag"
          @photo-tag-batch-update="updatePhotoTagsBatch"
          @photo-reorder="reorderSourcePhoto"
          @export-settings="exportSettingsJson"
          @share-settings-link="copySettingsShareLink"
          @import-settings="importSettingsFromFile"
          @class-preset-change="setClassPreset"
          @class-block-update="updateClassBlock"
          @class-block-add="addClassBlock"
          @class-block-remove="removeClassBlock"
          @class-photo-order-change="setClassPhotoOrder"
          @class-repeat-toggle="setAvoidImmediateRepeats"
          @class-assistant-generate="applyClassBuilderAssistant"
          @class-template-save="saveClassTemplateByName"
          @class-template-load="loadClassTemplateById"
          @class-template-delete="deleteClassTemplateById"
          @class-template-rename="renameClassTemplateById"
          @class-template-duplicate="duplicateClassTemplateById"
          @class-template-export="exportClassTemplatesJson"
          @class-template-import="importClassTemplatesFromFile"
          @start-session="startFreshSession"
          @new-random-set="createNewRandomSet"
          @clear-history="clearSessionHistory"
        />

        <ClassLaunchReviewDialog
          v-if="!isSessionLive"
          :is-open="isClassLaunchReviewOpen"
          :slots="classLaunchReviewSlots"
          @close="cancelClassLaunchReview"
          @reorder="reorderClassLaunchReview"
          @start-class="startClassFromReview"
        />

        <LiveControlsPanel
          v-if="isSessionLive"
          :session-mode="sessionMode"
          :duration-seconds="durationSeconds"
          :mirror-live-view="mirrorLiveView"
          :grayscale-live-view="grayscaleLiveView"
          :hide-live-overlay="hideLiveOverlay"
          :audio-muted="audioMuted"
          :audio-volume-percent="audioVolumePercent"
          :is-running="isRunning"
          :is-paused="isPaused"
          :has-source-photos="hasSourcePhotos"
          :pause-label="pauseLabel"
          :restart-label="restartActionLabel"
          :remote-status="hostRemoteStatus"
          :remote-offer-token="hostOfferToken"
          :remote-pairing-url="hostRemotePairingUrl"
          :remote-pairing-qr-data-url="hostRemotePairingQrDataUrl"
          :is-remote-connected="isHostRemoteConnected"
          @duration-input="updateDurationSeconds"
          @duration-change="applyDurationChange"
          @toggle-mirror-live-view="toggleMirrorLiveView"
          @toggle-grayscale-live-view="toggleGrayscaleLiveView"
          @toggle-hide-live-overlay="toggleHideLiveOverlay"
          @toggle-audio-muted="toggleAudioMuted"
          @audio-volume-input="setAudioVolumePercent"
          @toggle-pause="togglePause"
          @next="goToNextSlide"
          @new-set="createNewRandomSet"
          @end="stopSession"
          @remote-create-offer="createHostOfferToken"
          @remote-copy-offer-token="copyHostOfferToken"
          @remote-copy-pairing-link="copyHostPairingLink"
          @remote-apply-answer="applyHostAnswerToken"
          @remote-disconnect="disconnectHostRemote"
        />
      </section>

      <SlideStage
        v-if="isSessionLive"
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
    </section>
  </main>
</template>

<script setup>
import { computed, defineAsyncComponent } from "vue";
import AppHeader from "./AppHeader.vue";
import { useFigureSession } from "../composables/useFigureSession";
import { useLiveKeyboardShortcuts } from "../composables/useLiveKeyboardShortcuts";
import { usePhoneRemoteHost } from "../composables/usePhoneRemote";
import { useThemeMode } from "../composables/useThemeMode";

const SetupPanel = defineAsyncComponent(() => import("./SetupPanel.vue"));
const ClassLaunchReviewDialog = defineAsyncComponent(() =>
  import("./ClassLaunchReviewDialog.vue")
);
const LiveControlsPanel = defineAsyncComponent(() => import("./LiveControlsPanel.vue"));
const SlideStage = defineAsyncComponent(() => import("./SlideStage.vue"));

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
  audioMuted,
  audioVolumePercent,
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
  settingsSaveStatusText,
  sessionPreviewItems,
  sessionPreviewSummaryText,
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
  applyClassBuilderAssistant,
  toggleMirrorLiveView,
  toggleGrayscaleLiveView,
  toggleHideLiveOverlay,
  toggleAudioMuted,
  setAudioVolumePercent,
  exportSettingsJson,
  importSettingsFromFile,
  copySettingsShareLink,
  saveClassTemplateByName,
  loadClassTemplateById,
  deleteClassTemplateById,
  renameClassTemplateById,
  duplicateClassTemplateById,
  exportClassTemplatesJson,
  importClassTemplatesFromFile,
  startFreshSession,
  isClassLaunchReviewOpen,
  classLaunchReviewSlots,
  reorderClassLaunchReview,
  cancelClassLaunchReview,
  startClassFromReview,
  togglePause,
  goToNextSlide,
  createNewRandomSet,
  clearSessionHistory,
  stopSession,
  applyDurationChange,
  updatePhotoTag,
  updatePhotoTagsBatch,
  reorderSourcePhoto,
  handlePhotoSelection
} = useFigureSession();

function updateDurationSeconds(value) {
  durationSeconds.value = value;
}

const {
  remoteStatus: hostRemoteStatus,
  offerToken: hostOfferToken,
  pairingUrl: hostRemotePairingUrl,
  pairingQrDataUrl: hostRemotePairingQrDataUrl,
  isRemoteConnected: isHostRemoteConnected,
  createOfferToken: createHostOfferToken,
  copyHostOfferToken,
  copyHostPairingLink,
  applyAnswerToken: applyHostAnswerToken,
  disconnectHostRemote
} = usePhoneRemoteHost({
  onTogglePause: togglePause,
  onNextSlide: goToNextSlide,
  onStopSession: stopSession
});

const { themeMode, toggleThemeMode } = useThemeMode();

const shellClass = computed(() =>
  isSessionLive.value
    ? "relative min-h-dvh text-[rgb(var(--fd-ink))]"
    : "relative mx-auto my-6 grid w-[min(1120px,calc(100%-2rem))] gap-5 text-[rgb(var(--fd-ink))] max-[720px]:my-3 max-[720px]:w-[calc(100%-1rem)]"
);

const workspaceClass = computed(() =>
  isSessionLive.value ? "contents" : "grid gap-5"
);

const controlPanelClass = computed(() =>
  isSessionLive.value
    ? "surface-panel fixed bottom-2 left-2 z-30 w-[min(360px,calc(100vw-1rem))] rounded-2xl p-2"
    : "surface-panel relative grid gap-3 overflow-hidden rounded-3xl p-5 max-[720px]:rounded-xl max-[720px]:p-4"
);

useLiveKeyboardShortcuts({
  isSessionLive,
  onTogglePause: togglePause,
  onNextSlide: goToNextSlide,
  onStopSession: stopSession
});
</script>
