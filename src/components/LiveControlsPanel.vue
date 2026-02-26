<template>
  <div class="grid gap-2.5 stagger-in">
    <section class="grid gap-2 rounded-md border border-slate-600/60 bg-slate-900/60 p-2">
      <p class="text-xs font-medium uppercase tracking-wide text-slate-300">Live Controls</p>
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

    <section v-if="sessionMode === 'quick'" class="grid gap-1.5 rounded-md border border-slate-600/60 bg-slate-900/60 p-2">
      <p class="text-xs font-medium uppercase tracking-wide text-slate-300">Quick Timing</p>
      <DurationInput
        id="durationInputCompact"
        label="Sec / Photo"
        :value="durationSeconds"
        :compact="true"
        @update="$emit('duration-input', $event)"
        @commit="$emit('duration-change')"
      />
    </section>

    <section class="grid gap-2 rounded-md border border-slate-600/60 bg-slate-900/60 p-2">
      <div class="flex items-center justify-between gap-2">
        <div class="grid gap-0.5">
          <p class="text-xs font-medium text-slate-200">Advanced Controls</p>
          <p class="text-[11px] text-slate-400">Stage view and phone remote pairing.</p>
        </div>
        <BaseButton compact tone="subtle" @click="toggleAdvancedControls">
          {{ isAdvancedControlsOpen ? "Hide" : "Show" }}
        </BaseButton>
      </div>

      <div v-if="isAdvancedControlsOpen" class="grid gap-2">
        <section class="grid gap-1 rounded-md border border-slate-600/60 bg-slate-950/40 p-2">
          <p class="text-xs font-medium text-slate-200">Stage View</p>
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

        <section class="grid gap-1.5 rounded-md border border-slate-600/60 bg-slate-950/40 p-2">
          <p class="text-xs font-medium text-slate-200">Phone Remote</p>
          <p class="text-[11px] text-slate-400">{{ remoteStatus }}</p>

          <BaseButton compact tone="subtle" @click="$emit('remote-create-offer')">
            Generate Offer
          </BaseButton>

          <label v-if="remoteOfferToken" class="grid gap-1 text-xs text-slate-300" for="remoteOfferToken">
            <span>Offer Token (send to phone)</span>
            <textarea
              id="remoteOfferToken"
              readonly
              :value="remoteOfferToken"
              rows="4"
              class="w-full rounded-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-100"
            />
          </label>

          <label class="grid gap-1 text-xs text-slate-300" for="remoteAnswerToken">
            <span>Answer Token (from phone)</span>
            <textarea
              id="remoteAnswerToken"
              v-model.trim="remoteAnswerToken"
              rows="3"
              class="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-[11px] text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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
  "toggle-pause",
  "next",
  "new-set",
  "end",
  "remote-create-offer",
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
