<template>
  <main class="surface-panel mx-auto my-3 grid w-[min(640px,calc(100%-1rem))] gap-3 rounded-xl p-4 text-stone-800">
    <header class="grid gap-1">
      <h1 class="inline-flex items-center gap-2 text-lg font-semibold">
        <Smartphone class="h-5 w-5 text-sky-700" aria-hidden="true" />
        Phone Remote Control
      </h1>
      <p class="inline-flex items-center gap-1.5 text-[13px] text-stone-600">
        <Radio class="h-3.5 w-3.5 text-sky-700" aria-hidden="true" />
        {{ remoteStatus }}
      </p>
    </header>

    <p v-if="initialOfferToken" class="inline-flex items-center gap-1.5 rounded-md border border-amber-200/80 bg-white/62 px-2.5 py-1.5 text-[12px] text-stone-600">
      <Info class="h-3.5 w-3.5 text-sky-700" aria-hidden="true" />
      Pairing link detected. Offer token is pre-filled below.
    </p>

    <label class="grid gap-1 text-[13px] text-stone-700" for="desktopOfferToken">
      <span class="inline-flex items-center gap-1.5">
        <KeyRound class="h-3.5 w-3.5 text-sky-700" aria-hidden="true" />
        Desktop Offer Token
      </span>
      <textarea
        id="desktopOfferToken"
        v-model.trim="desktopOfferToken"
        rows="5"
        class="fd-input w-full rounded-md px-2.5 py-2 text-xs"
      />
    </label>

    <BaseButton :disabled="desktopOfferToken.length === 0" @click="$emit('create-answer-token', desktopOfferToken)">
      <Send class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
      Generate Answer Token
    </BaseButton>

    <label v-if="answerToken" class="grid gap-1 text-[13px] text-stone-700" for="phoneAnswerToken">
      <span class="inline-flex items-center gap-1.5">
        <ShieldCheck class="h-3.5 w-3.5 text-sky-700" aria-hidden="true" />
        Answer Token (paste this on desktop)
      </span>
      <textarea
        id="phoneAnswerToken"
        readonly
        :value="answerToken"
        rows="5"
        class="fd-input w-full rounded-md px-2.5 py-2 text-xs"
      />
      <BaseButton tone="subtle" @click="$emit('copy-answer-token')">
        <ClipboardCopy class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
        Copy Answer Token
      </BaseButton>
    </label>

    <section class="fd-card grid gap-2 rounded-lg p-3">
      <p class="inline-flex items-center gap-1.5 text-sm font-medium text-stone-800">
        <Radio class="h-4 w-4 text-sky-700" aria-hidden="true" />
        Remote Controls
      </p>
      <div class="grid grid-cols-3 gap-2 max-[480px]:grid-cols-1">
        <BaseButton :disabled="!isRemoteConnected" @click="$emit('send-command', 'toggle-pause')">
          <CirclePause class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Pause / Resume
        </BaseButton>
        <BaseButton :disabled="!isRemoteConnected" tone="subtle" @click="$emit('send-command', 'next-slide')">
          <SkipForward class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Next
        </BaseButton>
        <BaseButton :disabled="!isRemoteConnected" tone="danger" @click="$emit('send-command', 'end-session')">
          <CircleStop class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          End
        </BaseButton>
      </div>
      <BaseButton :disabled="!isRemoteConnected" tone="subtle" @click="$emit('disconnect')">
        <Unplug class="mr-1 h-3.5 w-3.5" aria-hidden="true" />
        Disconnect
      </BaseButton>
    </section>
  </main>
</template>

<script setup>
import { ref, watch } from "vue";
import {
  CirclePause,
  CircleStop,
  ClipboardCopy,
  Info,
  KeyRound,
  Radio,
  Send,
  ShieldCheck,
  SkipForward,
  Smartphone,
  Unplug
} from "lucide-vue-next";
import BaseButton from "./BaseButton.vue";

const props = defineProps({
  remoteStatus: {
    type: String,
    required: true
  },
  answerToken: {
    type: String,
    required: true
  },
  initialOfferToken: {
    type: String,
    default: ""
  },
  isRemoteConnected: {
    type: Boolean,
    required: true
  }
});

defineEmits(["create-answer-token", "copy-answer-token", "send-command", "disconnect"]);

const desktopOfferToken = ref(props.initialOfferToken || "");

watch(
  () => props.initialOfferToken,
  (nextOfferToken) => {
    const normalizedOfferToken = String(nextOfferToken || "").trim();
    if (!normalizedOfferToken) {
      return;
    }

    desktopOfferToken.value = normalizedOfferToken;
  }
);
</script>
