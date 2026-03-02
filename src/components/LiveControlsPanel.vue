<template>
  <div class="grid gap-3.5 stagger-in">
    <section class="fd-card grid gap-2.5 rounded-xl p-3">
      <p class="fd-section-label inline-flex items-center gap-1.5">
        <Radio class="h-4 w-4 text-sky-700" aria-hidden="true" />
        Live Controls
      </p>
      <BaseButton compact :disabled="!isRunning && !isPaused" @click="$emit('toggle-pause')">
        <component :is="isPaused ? Play : Pause" class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
        {{ pauseLabel }}
      </BaseButton>
      <div class="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
        <BaseButton compact :disabled="!isRunning" tone="subtle" @click="$emit('next')">
          <SkipForward class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Next
        </BaseButton>
        <BaseButton compact :disabled="!hasSourcePhotos" tone="subtle" @click="$emit('new-set')">
          <RefreshCw class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          {{ restartLabel }}
        </BaseButton>
      </div>
      <BaseButton compact tone="danger" @click="$emit('end')">
        <Square class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
        End Session
      </BaseButton>
    </section>

    <section v-if="sessionMode === 'quick'" class="fd-card grid gap-1.5 rounded-xl p-3">
      <p class="fd-section-label inline-flex items-center gap-1.5">
        <Timer class="h-4 w-4 text-sky-700" aria-hidden="true" />
        Quick Timing
      </p>
      <DurationInput
        id="durationInputCompact"
        label="Sec / Photo"
        :value="durationSeconds"
        :compact="true"
        @update="$emit('duration-input', $event)"
        @commit="$emit('duration-change')"
      />
    </section>

    <section class="fd-card grid gap-2.5 rounded-xl p-3">
      <div class="flex items-center justify-between gap-2">
        <div class="grid gap-0.5">
          <p class="fd-kicker inline-flex items-center gap-1.5">
            <SlidersHorizontal class="h-3.5 w-3.5 text-sky-700" aria-hidden="true" />
            Advanced Controls
          </p>
          <p class="fd-text-muted text-[12px]">Stage view and phone remote pairing.</p>
        </div>
        <BaseButton compact tone="subtle" @click="toggleAdvancedControls">
          <SlidersHorizontal class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          {{ isAdvancedControlsOpen ? "Hide" : "Show" }}
        </BaseButton>
      </div>

      <div v-if="isAdvancedControlsOpen" class="grid gap-2">
        <section class="fd-subtle-card grid gap-1.5 rounded-lg p-2.5">
          <p class="fd-text-body inline-flex items-center gap-1.5 text-[12px] font-semibold">
            <Monitor class="h-3.5 w-3.5 text-sky-700" aria-hidden="true" />
            Stage View
          </p>
          <div class="grid grid-cols-1 gap-1">
            <BaseButton compact :tone="mirrorLiveView ? 'primary' : 'subtle'" @click="$emit('toggle-mirror-live-view')">
              {{ mirrorLiveView ? "Mirror: On" : "Mirror: Off" }}
            </BaseButton>
            <BaseButton compact :tone="grayscaleLiveView ? 'primary' : 'subtle'" @click="$emit('toggle-grayscale-live-view')">
              {{ grayscaleLiveView ? "Grayscale: On" : "Grayscale: Off" }}
            </BaseButton>
            <BaseButton compact :tone="hideLiveOverlay ? 'primary' : 'subtle'" @click="$emit('toggle-hide-live-overlay')">
              {{ hideLiveOverlay ? "Timer Overlay: Hidden" : "Timer Overlay: Visible" }}
            </BaseButton>
          </div>
        </section>

        <section class="fd-subtle-card grid gap-1.5 rounded-lg p-2.5">
          <p class="fd-text-body inline-flex items-center gap-1.5 text-[12px] font-semibold">
            <Volume2 class="h-3.5 w-3.5 text-sky-700" aria-hidden="true" />
            Audio Cues
          </p>
          <div class="grid grid-cols-1 gap-1">
            <BaseButton compact :tone="audioMuted ? 'subtle' : 'primary'" @click="$emit('toggle-audio-muted')">
              <component :is="audioMuted ? VolumeX : Volume2" class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              {{ audioMuted ? "Audio Cues: Muted" : "Audio Cues: On" }}
            </BaseButton>
            <label class="fd-text-body grid gap-1 text-[12px]" for="audioVolumePercent">
              <span>Volume: {{ audioVolumePercent }}%</span>
              <input
                id="audioVolumePercent"
                type="range"
                min="0"
                max="100"
                step="1"
                :value="audioVolumePercent"
                class="fd-input w-full accent-lime-500"
                @input="$emit('audio-volume-input', $event.target.value)"
              />
            </label>
          </div>
        </section>

        <section class="fd-subtle-card grid gap-1.5 rounded-lg p-2.5">
          <p class="fd-text-body inline-flex items-center gap-1.5 text-[12px] font-semibold">
            <Smartphone class="h-3.5 w-3.5 text-sky-700" aria-hidden="true" />
            Phone Remote
          </p>
          <p class="fd-text-muted text-[12px]">{{ remoteStatus }}</p>

          <div class="grid grid-cols-2 gap-2">
            <BaseButton compact tone="subtle" @click="$emit('remote-create-offer')">
              <PlugZap class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Generate Offer
            </BaseButton>
            <BaseButton compact tone="subtle" :disabled="!remoteOfferToken" @click="$emit('remote-copy-offer-token')">
              <ClipboardCopy class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Copy Offer
            </BaseButton>
          </div>

          <label v-if="remotePairingUrl" class="fd-text-body grid gap-1 text-[12px]" for="remotePairingUrl">
            <span>Pairing Link (open on phone)</span>
            <textarea
              id="remotePairingUrl"
              readonly
              :value="remotePairingUrl"
              rows="3"
              class="fd-input w-full rounded-md px-2 py-1.5 text-[11px]"
            />
          </label>

          <BaseButton compact tone="subtle" :disabled="!remotePairingUrl" @click="$emit('remote-copy-pairing-link')">
            <Link2 class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Copy Pairing Link
          </BaseButton>

          <div v-if="remotePairingQrDataUrl" class="fd-callout-muted grid gap-1 rounded-md p-2">
            <p class="fd-text-muted inline-flex items-center gap-1.5 text-[12px]">
              <QrCode class="h-3.5 w-3.5 text-sky-700" aria-hidden="true" />
              Scan QR on phone to open pairing page
            </p>
            <img
              :src="remotePairingQrDataUrl"
              alt="QR code for phone remote pairing link"
              class="fd-callout mx-auto h-36 w-36 rounded-md p-1"
            />
          </div>

          <label v-if="remoteOfferToken" class="fd-text-body grid gap-1 text-[12px]" for="remoteOfferToken">
            <span>Offer Token (send to phone)</span>
            <textarea
              id="remoteOfferToken"
              readonly
              :value="remoteOfferToken"
              rows="4"
              class="fd-input w-full rounded-md px-2 py-1.5 text-[11px]"
            />
          </label>

          <label class="fd-text-body grid gap-1 text-[12px]" for="remoteAnswerToken">
            <span>Answer Token (from phone)</span>
            <textarea
              id="remoteAnswerToken"
              v-model.trim="remoteAnswerToken"
              rows="3"
              class="fd-input w-full rounded-md px-2 py-1.5 text-[11px]"
            />
          </label>

          <div class="grid grid-cols-2 gap-2">
            <BaseButton compact :disabled="remoteAnswerToken.length === 0" @click="applyAnswerToken">
              <Send class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Apply Answer
            </BaseButton>
            <BaseButton compact tone="subtle" :disabled="!isRemoteConnected" @click="$emit('remote-disconnect')">
              <Unplug class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Disconnect
            </BaseButton>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from "vue";
import {
  ClipboardCopy,
  Link2,
  Monitor,
  Pause,
  Play,
  PlugZap,
  QrCode,
  Radio,
  RefreshCw,
  Send,
  SkipForward,
  SlidersHorizontal,
  Smartphone,
  Square,
  Timer,
  Unplug,
  Volume2,
  VolumeX
} from "lucide-vue-next";
import BaseButton from "./BaseButton.vue";
import DurationInput from "./DurationInput.vue";

defineProps({
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
  isRunning: {
    type: Boolean,
    required: true
  },
  isPaused: {
    type: Boolean,
    required: true
  },
  hasSourcePhotos: {
    type: Boolean,
    required: true
  },
  pauseLabel: {
    type: String,
    required: true
  },
  restartLabel: {
    type: String,
    required: true
  },
  remoteStatus: {
    type: String,
    required: true
  },
  remoteOfferToken: {
    type: String,
    required: true
  },
  remotePairingUrl: {
    type: String,
    required: true
  },
  remotePairingQrDataUrl: {
    type: String,
    required: true
  },
  isRemoteConnected: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits([
  "duration-input",
  "duration-change",
  "toggle-mirror-live-view",
  "toggle-grayscale-live-view",
  "toggle-hide-live-overlay",
  "toggle-audio-muted",
  "audio-volume-input",
  "toggle-pause",
  "next",
  "new-set",
  "end",
  "remote-create-offer",
  "remote-copy-offer-token",
  "remote-copy-pairing-link",
  "remote-apply-answer",
  "remote-disconnect"
]);

const remoteAnswerToken = ref("");
const isAdvancedControlsOpen = ref(false);

function applyAnswerToken() {
  emit("remote-apply-answer", remoteAnswerToken.value);
  remoteAnswerToken.value = "";
}

function toggleAdvancedControls() {
  isAdvancedControlsOpen.value = !isAdvancedControlsOpen.value;
}
</script>
