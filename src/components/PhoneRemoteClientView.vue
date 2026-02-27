<template>
  <main class="surface-panel mx-auto my-3 grid w-[min(640px,calc(100%-1rem))] gap-3 rounded-xl p-4 text-stone-800">
    <header class="grid gap-1">
      <h1 class="text-lg font-semibold">Phone Remote Control</h1>
      <p class="text-sm text-stone-600">{{ remoteStatus }}</p>
    </header>

    <label class="grid gap-1 text-sm text-stone-700" for="desktopOfferToken">
      <span>Desktop Offer Token</span>
      <textarea
        id="desktopOfferToken"
        v-model.trim="desktopOfferToken"
        rows="5"
        class="fd-input w-full rounded-md px-2.5 py-2 text-xs"
      />
    </label>

    <BaseButton :disabled="desktopOfferToken.length === 0" @click="$emit('create-answer-token', desktopOfferToken)">
      Generate Answer Token
    </BaseButton>

    <label v-if="answerToken" class="grid gap-1 text-sm text-stone-700" for="phoneAnswerToken">
      <span>Answer Token (paste this on desktop)</span>
      <textarea
        id="phoneAnswerToken"
        readonly
        :value="answerToken"
        rows="5"
        class="fd-input w-full rounded-md px-2.5 py-2 text-xs"
      />
    </label>

    <section class="fd-card grid gap-2 rounded-md p-3">
      <p class="text-sm font-medium text-stone-800">Remote Controls</p>
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
