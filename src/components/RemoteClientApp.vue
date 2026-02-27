<template>
  <PhoneRemoteClientView
    :remote-status="remoteStatus"
    :answer-token="answerToken"
    :initial-offer-token="initialOfferToken"
    :is-remote-connected="isRemoteConnected"
    @create-answer-token="createAnswerToken"
    @copy-answer-token="copyAnswerToken"
    @send-command="sendRemoteCommand"
    @disconnect="disconnectClientRemote"
  />
</template>

<script setup>
import PhoneRemoteClientView from "./PhoneRemoteClientView.vue";
import { usePhoneRemoteClient } from "../composables/usePhoneRemote";

const {
  remoteStatus,
  answerToken,
  initialOfferToken,
  isRemoteConnected,
  createAnswerToken,
  copyAnswerToken,
  sendRemoteCommand,
  disconnectClientRemote
} = usePhoneRemoteClient();
</script>
