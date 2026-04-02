<template>
  <main class="fd-remote-page">
    <header class="fd-remote-header">
      <div class="grid gap-1">
        <p class="fd-section-label">{{ pageEyebrow }}</p>
        <h1 class="fd-page-title">{{ pageTitle }}</h1>
        <p class="fd-text-muted text-base">{{ pageDescription }}</p>
      </div>
      <span class="fd-chip rounded-full px-3 py-1 text-xs font-semibold">
        {{ stateLabel }}
      </span>
    </header>

    <section class="fd-page-panel">
      <div class="grid gap-1">
        <p class="fd-section-label">Status</p>
        <p class="fd-text-strong text-lg font-semibold">{{ remoteStatus }}</p>
      </div>

      <div v-if="activeState === 'pair'" class="grid gap-4">
        <section class="fd-callout rounded-2xl p-4">
          <p class="fd-text-body text-sm">
            {{
              initialOfferToken
                ? "Pairing link detected. Generate the answer token, then paste it back on desktop."
                : "Start on the desktop, then open the pairing link. Only use manual pairing if a link is unavailable."
            }}
          </p>
        </section>

        <div v-if="answerToken" class="fd-card grid gap-3 rounded-2xl p-4">
          <div class="grid gap-1">
            <p class="fd-section-label">Answer</p>
            <p class="fd-text-strong text-base font-semibold">Send this back to desktop</p>
          </div>
          <textarea
            id="phoneAnswerToken"
            readonly
            :value="answerToken"
            rows="5"
            class="fd-input w-full rounded-xl px-3 py-2 text-sm"
          />
          <BaseButton tone="subtle" @click="$emit('copy-answer-token')">
            <Copy class="fd-inline-icon-sm" aria-hidden="true" />
            Copy Answer Token
          </BaseButton>
        </div>

        <details class="fd-card fd-disclosure rounded-2xl p-4">
          <summary class="fd-disclosure-summary">
            <div class="grid gap-1">
              <p class="fd-section-label">Manual Pairing</p>
              <p class="fd-text-strong text-sm font-semibold">Use token exchange instead</p>
            </div>
            <span class="fd-chip rounded-full px-2.5 py-1 text-xs font-semibold">Fallback</span>
          </summary>

          <div class="mt-4 grid gap-3">
            <label class="grid gap-1.5 text-sm" for="desktopOfferToken">
              <span class="fd-text-muted">Desktop offer token</span>
              <textarea
                id="desktopOfferToken"
                v-model.trim="desktopOfferToken"
                rows="5"
                class="fd-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </label>

            <BaseButton :disabled="desktopOfferToken.length === 0" @click="$emit('create-answer-token', desktopOfferToken)">
              <ArrowRight class="fd-inline-icon-sm" aria-hidden="true" />
              Generate Answer Token
            </BaseButton>
          </div>
        </details>
      </div>

      <div v-else-if="activeState === 'connected'" class="grid gap-4">
        <section class="fd-callout rounded-2xl p-4">
          <p class="fd-text-body text-sm">The remote is connected. Use the controls below.</p>
        </section>

        <section class="fd-card grid gap-3 rounded-2xl p-4">
          <p class="fd-text-strong text-base font-semibold">Remote Controls</p>
          <div class="grid gap-2">
            <BaseButton :disabled="!isRemoteConnected" @click="$emit('send-command', 'toggle-pause')">
              Pause / Resume
            </BaseButton>
            <BaseButton :disabled="!isRemoteConnected" tone="subtle" @click="$emit('send-command', 'next-slide')">
              <ArrowRight class="fd-inline-icon-sm" aria-hidden="true" />
              Next
            </BaseButton>
            <BaseButton :disabled="!isRemoteConnected" tone="subtle" @click="$emit('disconnect')">
              Disconnect
            </BaseButton>
            <BaseButton :disabled="!isRemoteConnected" tone="danger" @click="$emit('send-command', 'end-session')">
              <Square class="fd-inline-icon-sm" aria-hidden="true" />
              End Session
            </BaseButton>
          </div>
        </section>
      </div>

      <div v-else class="grid gap-4">
        <section class="fd-subtle-card grid gap-2 rounded-2xl p-4">
          <p class="fd-text-body text-sm font-semibold">Status: {{ remoteDiagnostics.statusLabel }}</p>
          <p class="fd-text-muted text-sm">
            Peer: {{ remoteDiagnostics.connectionState }} | ICE: {{ remoteDiagnostics.iceConnectionState }} |
            Channel: {{ remoteDiagnostics.dataChannelState }}
          </p>
          <p class="fd-text-muted text-sm">{{ remoteDiagnostics.hint }}</p>
        </section>

        <div v-if="answerToken" class="fd-card grid gap-3 rounded-2xl p-4">
          <div class="grid gap-1">
            <p class="fd-section-label">Answer</p>
            <p class="fd-text-strong text-base font-semibold">Paste this on desktop</p>
          </div>
          <textarea
            readonly
            :value="answerToken"
            rows="5"
            class="fd-input w-full rounded-xl px-3 py-2 text-sm"
          />
          <BaseButton tone="subtle" @click="$emit('copy-answer-token')">
            <Copy class="fd-inline-icon-sm" aria-hidden="true" />
            Copy Answer Token
          </BaseButton>
        </div>

        <BaseButton
          v-if="remoteDiagnostics.retryRecommended"
          tone="subtle"
          @click="$emit('retry-connection')"
        >
          <RefreshCcw class="fd-inline-icon-sm" aria-hidden="true" />
          Retry Connection
        </BaseButton>

        <details class="fd-card fd-disclosure rounded-2xl p-4">
          <summary class="fd-disclosure-summary">
            <div class="grid gap-1">
              <p class="fd-section-label">Manual Pairing</p>
              <p class="fd-text-strong text-sm font-semibold">Use token exchange instead</p>
            </div>
            <span class="fd-chip rounded-full px-2.5 py-1 text-xs font-semibold">Fallback</span>
          </summary>

          <div class="mt-4 grid gap-3">
            <label class="grid gap-1.5 text-sm" for="desktopOfferTokenRetry">
              <span class="fd-text-muted">Desktop offer token</span>
              <textarea
                id="desktopOfferTokenRetry"
                v-model.trim="desktopOfferToken"
                rows="5"
                class="fd-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </label>

            <BaseButton :disabled="desktopOfferToken.length === 0" @click="$emit('create-answer-token', desktopOfferToken)">
              <ArrowRight class="fd-inline-icon-sm" aria-hidden="true" />
              Generate Answer Token
            </BaseButton>
          </div>
        </details>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { ArrowRight, Copy, RefreshCcw, Square } from "lucide-vue-next";
import { useRoute } from "vue-router";
import BaseButton from "./BaseButton.vue";

const route = useRoute();

const props = defineProps({
  remoteStatus: {
    type: String,
    required: true
  },
  remoteDiagnostics: {
    type: Object,
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

defineEmits([
  "create-answer-token",
  "copy-answer-token",
  "send-command",
  "retry-connection",
  "disconnect"
]);

const desktopOfferToken = ref(props.initialOfferToken || "");
const pageEyebrow = computed(() => String(route.meta.navLabel || "Remote"));
const pageTitle = computed(() => String(route.meta.pageTitle || "Phone control"));
const pageDescription = computed(() =>
  String(
    route.meta.pageDescription ||
      "Open this page from the pairing link. Manual token exchange is available if needed."
  )
);

const activeState = computed(() => {
  if (props.isRemoteConnected) {
    return "connected";
  }

  if (["error", "reconnecting"].includes(String(props.remoteDiagnostics?.category || ""))) {
    return "troubleshoot";
  }

  return "pair";
});

const stateLabel = computed(() => {
  if (activeState.value === "connected") {
    return "Connected";
  }
  if (activeState.value === "troubleshoot") {
    return "Troubleshoot";
  }
  return "Pair";
});

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
