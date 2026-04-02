<template>
  <AppSheet
    :is-open="isOpen"
    title="Pair phone"
    description="Use the pairing link or QR first. Manual token exchange is still available."
    eyebrow="Remote"
    placement="right"
    size="medium"
    @close="$emit('close')"
  >
    <div class="grid gap-4">
      <section class="fd-callout grid gap-2 rounded-2xl p-4">
        <p class="fd-text-strong text-sm font-semibold">{{ isRemoteConnected ? "Phone connected" : "Pairing ready" }}</p>
        <p class="fd-text-muted text-sm">{{ remoteStatus }}</p>
      </section>

      <section class="fd-card grid gap-3 rounded-2xl p-4">
        <div class="grid gap-1">
          <p class="fd-section-label">Primary</p>
          <p class="fd-text-strong text-base font-semibold">Open the link on your phone</p>
        </div>

        <label v-if="remotePairingUrl" class="grid gap-1.5 text-sm" for="livePairingUrl">
          <span class="fd-text-muted">Pairing link</span>
          <textarea
            id="livePairingUrl"
            readonly
            :value="remotePairingUrl"
            rows="3"
            class="fd-input w-full rounded-xl px-3 py-2 text-sm"
          />
        </label>

        <div
          v-if="remotePairingQrDataUrl"
          class="fd-subtle-card grid gap-2 rounded-2xl p-4 justify-items-center"
        >
          <img
            :src="remotePairingQrDataUrl"
            alt="QR code for phone pairing"
            class="fd-pairing-qr"
          />
          <p class="fd-text-muted text-sm">Scan to open the remote page.</p>
        </div>

        <div class="grid gap-2 sm:grid-cols-2">
          <BaseButton tone="subtle" @click="$emit('remote-create-offer')">
            <Smartphone class="fd-inline-icon-sm" aria-hidden="true" />
            {{ remoteOfferToken ? "Refresh Pairing" : "Generate Pairing" }}
          </BaseButton>
          <BaseButton tone="subtle" :disabled="!remotePairingUrl" @click="$emit('remote-copy-pairing-link')">
            <Link class="fd-inline-icon-sm" aria-hidden="true" />
            Copy Pairing Link
          </BaseButton>
        </div>
      </section>

      <details class="fd-card fd-disclosure rounded-2xl p-4">
        <summary class="fd-disclosure-summary">
          <div class="grid gap-1">
            <p class="fd-section-label">Manual Pairing</p>
            <p class="fd-text-strong text-sm font-semibold">Use token exchange instead</p>
          </div>
          <span class="fd-chip rounded-full px-2.5 py-1 text-xs font-semibold">Fallback</span>
        </summary>

        <div class="mt-4 grid gap-3">
          <label v-if="remoteOfferToken" class="grid gap-1.5 text-sm" for="manualOfferToken">
            <span class="fd-text-muted">Offer token</span>
            <textarea
              id="manualOfferToken"
              readonly
              :value="remoteOfferToken"
              rows="4"
              class="fd-input w-full rounded-xl px-3 py-2 text-sm"
            />
          </label>

          <div class="grid gap-2 sm:grid-cols-2">
            <BaseButton tone="subtle" :disabled="!remoteOfferToken" @click="$emit('remote-copy-offer-token')">
              <Copy class="fd-inline-icon-sm" aria-hidden="true" />
              Copy Offer
            </BaseButton>
            <BaseButton tone="subtle" :disabled="!remoteOfferToken" @click="$emit('remote-retry-reconnect')">
              <RefreshCcw class="fd-inline-icon-sm" aria-hidden="true" />
              Retry Reconnect
            </BaseButton>
          </div>

          <label class="grid gap-1.5 text-sm" for="manualAnswerToken">
            <span class="fd-text-muted">Answer token</span>
            <textarea
              id="manualAnswerToken"
              v-model.trim="answerToken"
              rows="4"
              class="fd-input w-full rounded-xl px-3 py-2 text-sm"
            />
          </label>

          <div class="grid gap-2 sm:grid-cols-2">
            <BaseButton :disabled="answerToken.length === 0" @click="applyAnswer">
              Apply Answer
            </BaseButton>
            <BaseButton tone="danger" :disabled="!isRemoteConnected" @click="$emit('remote-disconnect')">
              Disconnect
            </BaseButton>
          </div>
        </div>
      </details>
    </div>
  </AppSheet>
</template>

<script setup>
import { ref } from "vue";
import { Copy, Link, RefreshCcw, Smartphone } from "lucide-vue-next";
import BaseButton from "./BaseButton.vue";
import AppSheet from "./AppSheet.vue";

defineProps({
  isOpen: {
    type: Boolean,
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
  "close",
  "remote-create-offer",
  "remote-copy-offer-token",
  "remote-copy-pairing-link",
  "remote-apply-answer",
  "remote-retry-reconnect",
  "remote-disconnect"
]);

const answerToken = ref("");

function applyAnswer() {
  emit("remote-apply-answer", answerToken.value);
  answerToken.value = "";
}
</script>
