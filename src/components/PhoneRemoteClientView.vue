<template>
  <main class="mx-auto my-3 grid w-[min(640px,calc(100%-1rem))] gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4 text-slate-100">
    <header class="grid gap-1">
      <h1 class="text-lg font-semibold">Phone Remote Control</h1>
      <p class="text-sm text-slate-300">{{ remoteStatus }}</p>
    </header>

    <label class="grid gap-1 text-sm text-slate-200" for="desktopOfferToken">
      <span>Desktop Offer Token</span>
      <textarea
        id="desktopOfferToken"
        v-model.trim="desktopOfferToken"
        rows="5"
        class="w-full rounded-md border border-slate-600 bg-slate-900 px-2.5 py-2 text-xs text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      />
    </label>

    <BaseButton :disabled="desktopOfferToken.length === 0" @click="$emit('create-answer-token', desktopOfferToken)">
      Generate Answer Token
    </BaseButton>

    <label v-if="answerToken" class="grid gap-1 text-sm text-slate-200" for="phoneAnswerToken">
      <span>Answer Token (paste this on desktop)</span>
      <textarea
        id="phoneAnswerToken"
        readonly
        :value="answerToken"
        rows="5"
        class="w-full rounded-md border border-slate-600 bg-slate-950 px-2.5 py-2 text-xs text-slate-100"
      />
    </label>

    <section class="grid gap-2 rounded-md border border-slate-700 bg-slate-900/60 p-3">
      <p class="text-sm font-medium text-slate-100">Remote Controls</p>
      <div class="grid grid-cols-3 gap-2 max-[480px]:grid-cols-1">
        <BaseButton :disabled="!isRemoteConnected" @click="$emit('send-command', 'toggle-pause')">
          Pause / Resume
        </BaseButton>
        <BaseButton :disabled="!isRemoteConnected" tone="subtle" @click="$emit('send-command', 'next-slide')">
          Next
        </BaseButton>
        <BaseButton :disabled="!isRemoteConnected" tone="danger" @click="$emit('send-command', 'end-session')">
          End
        </BaseButton>
      </div>
      <BaseButton :disabled="!isRemoteConnected" tone="subtle" @click="$emit('disconnect')">
        Disconnect
      </BaseButton>
    </section>
  </main>
</template>

<script setup>
import { ref } from "vue";
import BaseButton from "./BaseButton.vue";

defineProps({
  remoteStatus: {
    type: String,
    required: true
  },
  answerToken: {
    type: String,
    required: true
  },
  isRemoteConnected: {
    type: Boolean,
    required: true
  }
});

defineEmits(["create-answer-token", "send-command", "disconnect"]);

const desktopOfferToken = ref("");
</script>
