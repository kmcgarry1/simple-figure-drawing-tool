<template>
  <PhoneRemoteClientView
    :remote-status="remoteStatus"
    :remote-diagnostics="remoteDiagnostics"
    :answer-token="answerToken"
    :initial-offer-token="initialOfferToken"
    :is-remote-connected="isRemoteConnected"
    @create-answer-token="createAnswerToken"
    @copy-answer-token="copyAnswerToken"
    @send-command="sendRemoteCommand"
    @retry-connection="retryClientReconnect"
    @disconnect="disconnectClientRemote"
  />
</template>

<script setup>
import PhoneRemoteClientView from "./PhoneRemoteClientView.vue";
import { usePhoneRemoteClient } from "../composables/usePhoneRemote";

const {
  remoteStatus,
  remoteDiagnostics,
  answerToken,
  initialOfferToken,
  isRemoteConnected,
  createAnswerToken,
  copyAnswerToken,
  sendRemoteCommand,
  retryClientReconnect,
  disconnectClientRemote
} = usePhoneRemoteClient();
</script>
