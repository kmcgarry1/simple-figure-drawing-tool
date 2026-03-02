<template>
  <div class="grid gap-3 stagger-in">
    <section class="fd-card grid gap-2.5 rounded-md p-2.5">
      <p class="fd-section-label text-sm">Live Controls</p>
      <BaseButton compact :disabled="!isRunning && !isPaused" @click="$emit('toggle-pause')">
        {{ pauseLabel }}
      </BaseButton>
      <div class="grid grid-cols-2 gap-1.5 max-[560px]:grid-cols-1">
        <BaseButton compact :disabled="!isRunning" tone="subtle" @click="$emit('next')">Next</BaseButton>
        <BaseButton compact :disabled="!hasSourcePhotos" tone="subtle" @click="$emit('new-set')">
          {{ restartLabel }}
        </BaseButton>
      </div>
      <BaseButton compact tone="danger" @click="$emit('end')">End Session</BaseButton>
    </section>

    <section v-if="sessionMode === 'quick'" class="fd-card grid gap-1.5 rounded-md p-2.5">
      <p class="fd-section-label text-sm">Quick Timing</p>
      <DurationInput
        id="durationInputCompact"
        label="Sec / Photo"
        :value="durationSeconds"
        :compact="true"
        @update="$emit('duration-input', $event)"
        @commit="$emit('duration-change')"
      />
    </section>

    <section class="fd-card grid gap-2 rounded-md p-2.5">
      <div class="flex items-center justify-between gap-2">
        <div class="grid gap-0.5">
          <p class="text-xs font-semibold text-stone-700">Advanced Controls</p>
          <p class="text-[11px] text-stone-500">Stage view and phone remote pairing.</p>
        </div>
        <BaseButton compact tone="subtle" @click="toggleAdvancedControls">
          {{ isAdvancedControlsOpen ? "Hide" : "Show" }}
        </BaseButton>
      </div>

      <div v-if="isAdvancedControlsOpen" class="grid gap-2">
        <section class="fd-subtle-card grid gap-1 rounded-md p-2">
          <p class="text-xs font-semibold text-stone-700">Stage View</p>
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

        <section class="fd-subtle-card grid gap-1 rounded-md p-2">
          <p class="text-xs font-semibold text-stone-700">Audio Cues</p>
          <div class="grid grid-cols-1 gap-1">
            <BaseButton compact :tone="audioMuted ? 'subtle' : 'primary'" @click="$emit('toggle-audio-muted')">
              {{ audioMuted ? "Audio Cues: Muted" : "Audio Cues: On" }}
            </BaseButton>
            <label class="grid gap-1 text-xs text-stone-600" for="audioVolumePercent">
              <span>Volume: {{ audioVolumePercent }}%</span>
              <input
                id="audioVolumePercent"
                type="range"
                min="0"
                max="100"
                step="1"
                :value="audioVolumePercent"
                class="fd-input w-full accent-amber-500"
                @input="$emit('audio-volume-input', $event.target.value)"
              />
            </label>
          </div>
        </section>

        <section class="fd-subtle-card grid gap-1.5 rounded-md p-2">
          <p class="text-xs font-semibold text-stone-700">Phone Remote</p>
          <p class="text-[11px] text-stone-500">{{ remoteStatus }}</p>

          <div class="grid grid-cols-2 gap-2">
            <BaseButton compact tone="subtle" @click="$emit('remote-create-offer')">
              Generate Offer
            </BaseButton>
            <BaseButton compact tone="subtle" :disabled="!remoteOfferToken" @click="$emit('remote-copy-offer-token')">
              Copy Offer
            </BaseButton>
          </div>

          <label v-if="remotePairingUrl" class="grid gap-1 text-xs text-stone-600" for="remotePairingUrl">
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
            Copy Pairing Link
          </BaseButton>

          <div v-if="remotePairingQrDataUrl" class="grid gap-1 rounded-md border border-amber-200/80 bg-white/60 p-2">
            <p class="text-[11px] text-stone-600">Scan QR on phone to open pairing page</p>
            <img
              :src="remotePairingQrDataUrl"
              alt="QR code for phone remote pairing link"
              class="mx-auto h-36 w-36 rounded-md border border-amber-200/80 bg-white p-1"
            />
          </div>

          <label v-if="remoteOfferToken" class="grid gap-1 text-xs text-stone-600" for="remoteOfferToken">
            <span>Offer Token (send to phone)</span>
            <textarea
              id="remoteOfferToken"
              readonly
              :value="remoteOfferToken"
              rows="4"
              class="fd-input w-full rounded-md px-2 py-1.5 text-[11px]"
            />
          </label>

          <label class="grid gap-1 text-xs text-stone-600" for="remoteAnswerToken">
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
              Apply Answer
            </BaseButton>
            <BaseButton compact tone="subtle" :disabled="!isRemoteConnected" @click="$emit('remote-disconnect')">
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
