<template>
  <div class="grid grid-cols-2 gap-1.5">
    <BaseButton compact :disabled="!isRunning && !isPaused" @click="$emit('toggle-pause')">
      {{ pauseLabel }}
    </BaseButton>
    <BaseButton compact :disabled="!isRunning" tone="subtle" @click="$emit('next')">Next</BaseButton>
    <BaseButton compact :disabled="!hasSourcePhotos" tone="subtle" @click="$emit('new-set')">
      {{ restartLabel }}
    </BaseButton>
    <BaseButton compact tone="danger" @click="$emit('end')">End</BaseButton>
  </div>

  <DurationInput
    v-if="sessionMode === 'quick'"
    id="durationInputCompact"
    label="Sec / Photo"
    :value="durationSeconds"
    :compact="true"
    @update="$emit('duration-input', $event)"
    @commit="$emit('duration-change')"
  />

  <section class="grid gap-1.5 rounded-md border border-slate-600/60 bg-slate-900/60 p-2">
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
        class="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-[11px] text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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
  "toggle-pause",
  "next",
  "new-set",
  "end",
  "remote-create-offer",
  "remote-apply-answer",
  "remote-disconnect"
]);

const remoteAnswerToken = ref("");

function applyAnswerToken() {
  emit("remote-apply-answer", remoteAnswerToken.value);
  remoteAnswerToken.value = "";
}
</script>
