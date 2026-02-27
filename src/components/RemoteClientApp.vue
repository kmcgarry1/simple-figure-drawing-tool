<template>
  <PhoneRemoteClientView
    :remote-status="remoteStatus"
    :answer-token="answerToken"
    :is-remote-connected="isRemoteConnected"
    @create-answer-token="createAnswerToken"
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
  isRemoteConnected,
  createAnswerToken,
  sendRemoteCommand,
  disconnectClientRemote
} = usePhoneRemoteClient();
</script>
