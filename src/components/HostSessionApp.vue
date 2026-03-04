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
          :class-template-sync-enabled="classTemplateSyncEnabled"
          :class-template-sync-key="classTemplateSyncKey"
          :has-class-plan="hasClassPlan"
          :class-target-minutes="classTargetMinutes"
          :class-pose-count="classPoseCount"
          :class-total-minutes-text="classTotalMinutesText"
          :class-delta-text="classDeltaText"
          :start-action-label="startActionLabel"
          :regenerate-action-label="regenerateActionLabel"
          :has-source-photos="hasSourcePhotos"
          :session-history="sessionHistory"
          :run-snapshots="runSnapshots"
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
          @class-template-sync-key-change="setClassTemplateSyncKey"
          @class-template-sync-pull="pullClassTemplatesFromSync"
          @class-template-sync-push="pushClassTemplatesToSync"
          @start-session="startFreshSession"
          @new-random-set="createNewRandomSet"
          @clear-history="clearSessionHistory"
          @rerun-history="rerunSessionFromHistory"
          @save-history-snapshot="saveRunSnapshotFromHistory"
          @restore-run-snapshot="restoreRunSnapshot"
          @delete-run-snapshot="deleteRunSnapshot"
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
          :remote-diagnostics="hostRemoteDiagnostics"
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
          @remote-retry-reconnect="retryHostReconnect"
          @remote-disconnect="disconnectHostRemote"
        />
      </section>

      <aside
        v-if="!isSessionLive"
        class="surface-panel fd-context-rail grid gap-3 rounded-[1.6rem] p-4 max-[720px]:rounded-xl max-[720px]:p-3"
        aria-label="Studio context"
      >
        <section class="fd-card fd-context-card grid gap-2 rounded-2xl p-3">
          <p class="fd-section-label">Session Context</p>
          <p class="fd-text-strong text-sm font-semibold">{{ sessionModeLabel }}</p>
          <p class="fd-text-muted text-xs leading-5">
            {{ sessionPreviewSummaryText }}
          </p>
        </section>

        <section class="grid grid-cols-2 gap-2">
          <article class="fd-subtle-card fd-metric-card grid gap-0.5 rounded-xl px-2.5 py-2">
            <p class="fd-kicker">Photos</p>
            <p class="fd-text-strong text-sm font-semibold">{{ taggedPhotos.length }}</p>
          </article>
          <article class="fd-subtle-card fd-metric-card grid gap-0.5 rounded-xl px-2.5 py-2">
            <p class="fd-kicker">Templates</p>
            <p class="fd-text-strong text-sm font-semibold">{{ classTemplates.length }}</p>
          </article>
          <article class="fd-subtle-card fd-metric-card grid gap-0.5 rounded-xl px-2.5 py-2">
            <p class="fd-kicker">History Runs</p>
            <p class="fd-text-strong text-sm font-semibold">{{ sessionHistory.length }}</p>
          </article>
          <article class="fd-subtle-card fd-metric-card grid gap-0.5 rounded-xl px-2.5 py-2">
            <p class="fd-kicker">Snapshots</p>
            <p class="fd-text-strong text-sm font-semibold">{{ runSnapshots.length }}</p>
          </article>
        </section>

        <section class="fd-callout fd-context-readiness grid gap-2 rounded-2xl p-3">
          <div class="flex items-center justify-between gap-2">
            <p class="fd-section-label">Readiness</p>
            <span class="fd-chip rounded-full px-2 py-0.5 text-[11px] font-semibold">
              {{ setupCompletionPercent }}%
            </span>
          </div>
          <div class="h-1.5 overflow-hidden rounded-full bg-[rgb(var(--fd-surface-muted)/0.84)]">
            <span
              class="block h-full rounded-full bg-gradient-to-r from-sky-300 via-emerald-300 to-orange-300 transition-[width] duration-300"
              :style="{ width: `${setupCompletionPercent}%` }"
            />
          </div>
          <ul class="grid gap-1 text-xs">
            <li
              v-for="item in setupChecklist"
              :key="item.id"
              class="fd-text-body inline-flex items-center gap-1.5"
            >
              <span
                class="inline-flex h-2.5 w-2.5 rounded-full"
                :class="item.complete ? 'bg-emerald-400' : 'bg-[rgb(var(--fd-border-strong)/0.86)]'"
                aria-hidden="true"
              />
              {{ item.label }}
            </li>
          </ul>
        </section>

        <section class="fd-subtle-card fd-context-defaults grid gap-1.5 rounded-2xl p-3">
          <p class="fd-section-label">Current Defaults</p>
          <p class="fd-text-body text-xs">
            <span class="font-semibold">Mode:</span> {{ sessionModeLabel }}
          </p>
          <p v-if="sessionMode === 'quick'" class="fd-text-body text-xs">
            <span class="font-semibold">Timing:</span> {{ quickDurationLabel }}
          </p>
          <p v-else class="fd-text-body text-xs">
            <span class="font-semibold">Class Plan:</span> {{ classPoseCount }} poses, {{ classTotalMinutesText }}
          </p>
          <p
            v-if="sessionMode === 'class'"
            class="fd-text-caption text-xs"
          >
            {{ classDeltaText }}
          </p>
          <p class="fd-text-caption text-xs">{{ settingsSaveStatusText }}</p>
        </section>
      </aside>

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
  classTemplateSyncEnabled,
  classTemplateSyncKey,
  hasClassPlan,
  classTargetMinutes,
  classPoseCount,
  classTotalMinutesText,
  classDeltaText,
  startActionLabel,
  regenerateActionLabel,
  restartActionLabel,
  sessionHistory,
  runSnapshots,
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
  setClassTemplateSyncKey,
  pullClassTemplatesFromSync,
  pushClassTemplatesToSync,
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
  rerunSessionFromHistory,
  saveRunSnapshotFromHistory,
  restoreRunSnapshot,
  deleteRunSnapshot,
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
  remoteDiagnostics: hostRemoteDiagnostics,
  offerToken: hostOfferToken,
  pairingUrl: hostRemotePairingUrl,
  pairingQrDataUrl: hostRemotePairingQrDataUrl,
  isRemoteConnected: isHostRemoteConnected,
  createOfferToken: createHostOfferToken,
  copyHostOfferToken,
  copyHostPairingLink,
  applyAnswerToken: applyHostAnswerToken,
  retryHostReconnect,
  disconnectHostRemote
} = usePhoneRemoteHost({
  onTogglePause: togglePause,
  onNextSlide: goToNextSlide,
  onStopSession: stopSession
});

const { themeMode, toggleThemeMode } = useThemeMode();

const sessionModeLabel = computed(() =>
  sessionMode.value === "class" ? "Life Class Session" : "Quick Session"
);

const quickDurationLabel = computed(() => {
  const parsedDuration = Number.parseInt(String(durationSeconds.value), 10);
  const safeDuration = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 0;
  return `${safeDuration}s per photo`;
});

const setupChecklist = computed(() => {
  const isSessionConfigured = sessionMode.value === "quick" ? true : hasClassPlan.value;
  const canStartSession = sessionMode.value === "quick"
    ? hasSourcePhotos.value
    : hasSourcePhotos.value && hasClassPlan.value;

  return [
    {
      id: "photos",
      label: hasSourcePhotos.value ? "Source photos loaded" : "Load source photos",
      complete: hasSourcePhotos.value
    },
    {
      id: "session",
      label:
        sessionMode.value === "quick"
          ? "Quick session configured"
          : hasClassPlan.value
            ? "Class plan configured"
            : "Add at least one class pose block",
      complete: isSessionConfigured
    },
    {
      id: "launch",
      label: canStartSession ? "Ready to launch session" : "Complete setup to launch",
      complete: canStartSession
    }
  ];
});

const setupCompletionPercent = computed(() => {
  const totalSteps = setupChecklist.value.length || 1;
  const completedSteps = setupChecklist.value.filter((item) => item.complete).length;
  return Math.round((completedSteps / totalSteps) * 100);
});

const shellClass = computed(() =>
  isSessionLive.value
    ? "relative min-h-dvh text-[rgb(var(--fd-ink))]"
    : "relative mx-auto my-6 grid w-[min(1200px,calc(100%-2rem))] gap-5 text-[rgb(var(--fd-ink))] max-[720px]:my-3 max-[720px]:w-[calc(100%-1rem)]"
);

const workspaceClass = computed(() =>
  isSessionLive.value
    ? "contents"
    : "grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(290px,340px)] xl:items-start"
);

const controlPanelClass = computed(() =>
  isSessionLive.value
    ? "surface-panel fixed bottom-2 left-2 z-30 w-[min(360px,calc(100vw-1rem))] rounded-2xl p-2"
    : "surface-panel relative grid gap-3 overflow-hidden rounded-[1.8rem] p-5 max-[720px]:rounded-xl max-[720px]:p-4"
);

useLiveKeyboardShortcuts({
  isSessionLive,
  onTogglePause: togglePause,
  onNextSlide: goToNextSlide,
  onStopSession: stopSession
});
</script>
