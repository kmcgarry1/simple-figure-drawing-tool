<template>
  <div v-if="session.isSessionLive.value" class="fd-live-root">
    <SlideStage
      :is-session-live="session.isSessionLive.value"
      :current-slide-url="session.currentSlideUrl.value"
      :current-slide-alt="session.currentSlideAlt.value"
      :placeholder-text="session.placeholderText.value"
      :slide-counter-text="session.slideCounterText.value"
      :time-left-text="session.timeLeftText.value"
      :active-pose-label="session.activePoseLabel.value"
      :session-time-left-text="session.sessionTimeLeftText.value"
      :timer-fill-percent="session.timerFillPercent.value"
      :mirror-live-view="session.mirrorLiveView.value"
      :grayscale-live-view="session.grayscaleLiveView.value"
      :hide-live-overlay="session.hideLiveOverlay.value"
    />

    <div class="surface-panel fd-live-toolbar">
      <div class="fd-live-toolbar-main">
        <BaseButton compact @click="session.togglePause">
          {{ session.pauseLabel.value }}
        </BaseButton>
        <BaseButton compact tone="subtle" @click="session.goToNextSlide">
          <ArrowRight class="fd-inline-icon-sm" aria-hidden="true" />
          Next
        </BaseButton>
        <BaseButton compact tone="subtle" @click="openPairPhoneSheet">
          <Smartphone class="fd-inline-icon-sm" aria-hidden="true" />
          Pair Phone
        </BaseButton>
        <BaseButton compact tone="danger" @click="session.stopSession">
          End
        </BaseButton>
      </div>
      <div class="fd-live-toolbar-utility">
        <button type="button" class="fd-live-settings-button" @click="isLiveSettingsOpen = true">
          <SlidersHorizontal class="fd-inline-icon" aria-hidden="true" />
          Session Settings
        </button>
      </div>
    </div>

    <LivePhoneSheet
      :is-open="isPairPhoneSheetOpen"
      :remote-status="remote.remoteStatus.value"
      :remote-offer-token="remote.offerToken.value"
      :remote-pairing-url="remote.pairingUrl.value"
      :remote-pairing-qr-data-url="remote.pairingQrDataUrl.value"
      :is-remote-connected="remote.isRemoteConnected.value"
      @close="isPairPhoneSheetOpen = false"
      @remote-create-offer="remote.createOfferToken"
      @remote-copy-offer-token="remote.copyHostOfferToken"
      @remote-copy-pairing-link="remote.copyHostPairingLink"
      @remote-apply-answer="remote.applyAnswerToken"
      @remote-retry-reconnect="remote.retryHostReconnect"
      @remote-disconnect="remote.disconnectHostRemote"
    />

    <LiveSessionSettingsSheet
      :is-open="isLiveSettingsOpen"
      :session-mode="session.sessionMode.value"
      :duration-seconds="session.durationSeconds.value"
      :mirror-live-view="session.mirrorLiveView.value"
      :grayscale-live-view="session.grayscaleLiveView.value"
      :hide-live-overlay="session.hideLiveOverlay.value"
      :audio-muted="session.audioMuted.value"
      :audio-volume-percent="session.audioVolumePercent.value"
      :remote-status="remote.remoteStatus.value"
      :remote-diagnostics="remote.remoteDiagnostics.value"
      :is-remote-connected="remote.isRemoteConnected.value"
      @close="isLiveSettingsOpen = false"
      @duration-input="updateDurationSeconds"
      @duration-change="session.applyDurationChange"
      @toggle-mirror-live-view="session.toggleMirrorLiveView"
      @toggle-grayscale-live-view="session.toggleGrayscaleLiveView"
      @toggle-hide-live-overlay="session.toggleHideLiveOverlay"
      @toggle-audio-muted="session.toggleAudioMuted"
      @audio-volume-input="session.setAudioVolumePercent"
      @remote-create-offer="remote.createOfferToken"
      @remote-retry-reconnect="remote.retryHostReconnect"
      @remote-disconnect="remote.disconnectHostRemote"
    />
  </div>

  <main v-else class="fd-app-shell">
    <AppHeader
      :theme-mode="themeMode"
      :settings-save-status-text="session.settingsSaveStatusText.value"
      @toggle-theme="toggleThemeMode"
    />

    <section class="fd-shell-view">
      <RouterView />
    </section>

    <ManageLibraryDrawer
      :is-open="isLibraryDrawerOpen"
      :tagged-photos="session.taggedPhotos.value"
      :available-photo-tags="session.availablePhotoTags.value"
      :settings-save-status-text="session.settingsSaveStatusText.value"
      @close="closeLibraryDrawer"
      @photo-tag-update="session.updatePhotoTag"
      @photo-tag-batch-update="session.updatePhotoTagsBatch"
      @photo-reorder="session.reorderSourcePhoto"
      @export-settings="session.exportSettingsJson"
      @share-settings-link="session.copySettingsShareLink"
      @import-settings="session.importSettingsFromFile"
    />

    <ClassLaunchReviewDialog
      :is-open="session.isClassLaunchReviewOpen.value"
      :slots="session.classLaunchReviewSlots.value"
      @close="session.cancelClassLaunchReview"
      @reorder="session.reorderClassLaunchReview"
      @start-class="session.startClassFromReview"
    />
  </main>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { ArrowRight, SlidersHorizontal, Smartphone } from "lucide-vue-next";
import { RouterView, useRoute } from "vue-router";
import { buildHostSessionViewModels, provideHostSessionContext } from "../composables/useHostSessionContext";
import { useFigureSession } from "../composables/useFigureSession";
import { useLiveKeyboardShortcuts } from "../composables/useLiveKeyboardShortcuts";
import { usePhoneRemoteHost } from "../composables/usePhoneRemote";
import { useThemeMode } from "../composables/useThemeMode";
import AppHeader from "./AppHeader.vue";
import BaseButton from "./BaseButton.vue";
import ClassLaunchReviewDialog from "./ClassLaunchReviewDialog.vue";
import LivePhoneSheet from "./LivePhoneSheet.vue";
import LiveSessionSettingsSheet from "./LiveSessionSettingsSheet.vue";
import ManageLibraryDrawer from "./ManageLibraryDrawer.vue";
import SlideStage from "./SlideStage.vue";

const route = useRoute();
const session = useFigureSession();
const { themeMode, toggleThemeMode } = useThemeMode();
const remote = usePhoneRemoteHost({
  onTogglePause: session.togglePause,
  onNextSlide: session.goToNextSlide,
  onStopSession: session.stopSession
});

const viewModels = buildHostSessionViewModels({
  session,
  remote
});

const isLibraryDrawerOpen = ref(false);
const isPairPhoneSheetOpen = ref(false);
const isLiveSettingsOpen = ref(false);
const canOpenLibraryDrawer = computed(
  () => route.name === "studio" && session.hasSourcePhotos.value
);

watch(
  canOpenLibraryDrawer,
  (canOpen) => {
    if (!canOpen) {
      isLibraryDrawerOpen.value = false;
    }
  },
  { immediate: true }
);

function updateDurationSeconds(value) {
  session.durationSeconds.value = value;
}

function closeLibraryDrawer() {
  isLibraryDrawerOpen.value = false;
}

async function openPairPhoneSheet() {
  isPairPhoneSheetOpen.value = true;
  if (!remote.offerToken.value) {
    await remote.createOfferToken();
  }
}

provideHostSessionContext({
  session,
  remote,
  themeMode,
  toggleThemeMode,
  viewModels,
  route,
  openLibraryDrawer() {
    if (canOpenLibraryDrawer.value) {
      isLibraryDrawerOpen.value = true;
    }
  },
  closeLibraryDrawer
});

useLiveKeyboardShortcuts({
  isSessionLive: session.isSessionLive,
  onTogglePause: session.togglePause,
  onNextSlide: session.goToNextSlide,
  onStopSession: session.stopSession
});
</script>
