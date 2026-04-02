<template>
  <AppSheet
    :is-open="isOpen"
    title="Session settings"
    description="Adjust stage behavior, quick timing, audio cues, and troubleshooting tools."
    eyebrow="Settings"
    placement="right"
    size="narrow"
    @close="$emit('close')"
  >
    <div class="grid gap-4">
      <section v-if="sessionMode === 'quick'" class="fd-card grid gap-3 rounded-2xl p-4">
        <div class="grid gap-1">
          <p class="fd-section-label">Quick timing</p>
          <p class="fd-text-strong text-base font-semibold">Update the run timer</p>
        </div>
        <DurationInput
          id="liveQuickDurationInput"
          label="Seconds per photo"
          :value="durationSeconds"
          @update="$emit('duration-input', $event)"
          @commit="$emit('duration-change')"
        />
      </section>

      <section class="fd-card grid gap-3 rounded-2xl p-4">
        <div class="grid gap-1">
          <p class="fd-section-label">Stage</p>
          <p class="fd-text-strong text-base font-semibold">Adjust how the image is shown</p>
        </div>
        <div class="grid gap-2">
          <BaseButton tone="subtle" @click="$emit('toggle-mirror-live-view')">
            {{ mirrorLiveView ? "Mirror On" : "Mirror Off" }}
          </BaseButton>
          <BaseButton tone="subtle" @click="$emit('toggle-grayscale-live-view')">
            {{ grayscaleLiveView ? "Grayscale On" : "Grayscale Off" }}
          </BaseButton>
          <BaseButton tone="subtle" @click="$emit('toggle-hide-live-overlay')">
            {{ hideLiveOverlay ? "Hide Timer Overlay" : "Show Timer Overlay" }}
          </BaseButton>
        </div>
      </section>

      <section class="fd-card grid gap-3 rounded-2xl p-4">
        <div class="grid gap-1">
          <p class="fd-section-label">Audio</p>
          <p class="fd-text-strong text-base font-semibold">Cue volume</p>
        </div>
        <BaseButton tone="subtle" @click="$emit('toggle-audio-muted')">
          {{ audioMuted ? "Audio Muted" : "Audio On" }}
        </BaseButton>
        <label class="grid gap-1.5 text-sm" for="audioVolumePercent">
          <span class="fd-text-muted">Volume {{ audioVolumePercent }}%</span>
          <input
            id="audioVolumePercent"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="audioVolumePercent"
            class="fd-range-input"
            @input="$emit('audio-volume-input', $event.target.value)"
          />
        </label>
      </section>

      <details class="fd-card fd-disclosure rounded-2xl p-4" :open="showTroubleshootOpen">
        <summary class="fd-disclosure-summary">
          <div class="grid gap-1">
            <p class="fd-section-label">Troubleshoot</p>
            <p class="fd-text-strong text-sm font-semibold">Remote diagnostics</p>
          </div>
          <span class="fd-chip rounded-full px-2.5 py-1 text-xs font-semibold">Utility</span>
        </summary>

        <div class="mt-4 grid gap-3">
          <section class="fd-subtle-card grid gap-1 rounded-2xl p-4">
            <p class="fd-text-body text-sm font-semibold">Status: {{ remoteDiagnostics.statusLabel }}</p>
            <p class="fd-text-muted text-sm">
              Peer: {{ remoteDiagnostics.connectionState }} | ICE: {{ remoteDiagnostics.iceConnectionState }} |
              Channel: {{ remoteDiagnostics.dataChannelState }}
            </p>
            <p class="fd-text-muted text-sm">{{ remoteStatus }}</p>
            <p class="fd-text-muted text-sm">{{ remoteDiagnostics.hint }}</p>
          </section>

          <div class="grid gap-2">
            <BaseButton tone="subtle" @click="$emit('remote-create-offer')">
              <RefreshCcw class="fd-inline-icon-sm" aria-hidden="true" />
              Generate Offer
            </BaseButton>
            <BaseButton
              v-if="remoteDiagnostics.retryRecommended"
              tone="subtle"
              @click="$emit('remote-retry-reconnect')"
            >
              <RefreshCcw class="fd-inline-icon-sm" aria-hidden="true" />
              Retry Reconnect
            </BaseButton>
            <BaseButton tone="danger" :disabled="!isRemoteConnected" @click="$emit('remote-disconnect')">
              Disconnect Phone
            </BaseButton>
          </div>
        </div>
      </details>
    </div>
  </AppSheet>
</template>

<script setup>
import { computed } from "vue";
import { RefreshCcw } from "lucide-vue-next";
import BaseButton from "./BaseButton.vue";
import AppSheet from "./AppSheet.vue";
import DurationInput from "./DurationInput.vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  sessionMode: {
    type: String,
    required: true
  },
  durationSeconds: {
    type: [Number, String],
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
  },
  audioMuted: {
    type: Boolean,
    required: true
  },
  audioVolumePercent: {
    type: [Number, String],
    required: true
  },
  remoteStatus: {
    type: String,
    required: true
  },
  remoteDiagnostics: {
    type: Object,
    required: true
  },
  isRemoteConnected: {
    type: Boolean,
    required: true
  }
});

defineEmits([
  "close",
  "duration-input",
  "duration-change",
  "toggle-mirror-live-view",
  "toggle-grayscale-live-view",
  "toggle-hide-live-overlay",
  "toggle-audio-muted",
  "audio-volume-input",
  "remote-create-offer",
  "remote-retry-reconnect",
  "remote-disconnect"
]);

const showTroubleshootOpen = computed(() =>
  ["error", "reconnecting"].includes(String(props.remoteDiagnostics?.category || ""))
);
</script>
