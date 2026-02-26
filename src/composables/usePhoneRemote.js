import { computed, onBeforeUnmount, ref } from "vue";

function canUseWebRtc() {
  return typeof window !== "undefined" && typeof window.RTCPeerConnection !== "undefined";
}

function encodeSignalPayload(payload) {
  const json = JSON.stringify(payload);
  return btoa(encodeURIComponent(json));
}

function decodeSignalPayload(token) {
  const decoded = decodeURIComponent(atob(String(token || "").trim()));
  return JSON.parse(decoded);
}

function waitForIceGatheringComplete(peerConnection) {
  if (peerConnection.iceGatheringState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    function handleStateChange() {
      if (peerConnection.iceGatheringState === "complete") {
        peerConnection.removeEventListener("icegatheringstatechange", handleStateChange);
        resolve();
      }
    }

    peerConnection.addEventListener("icegatheringstatechange", handleStateChange);
  });
}

function buildPeerConnection() {
  return new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302"
      }
    ]
  });
}

export function usePhoneRemoteHost({
  onTogglePause,
  onNextSlide,
  onStopSession
}) {
  const remoteStatus = ref("Remote disconnected.");
  const offerToken = ref("");
  const isRemoteConnected = ref(false);

  let peerConnection = null;
  let dataChannel = null;

  function closeHostConnection() {
    if (dataChannel) {
      dataChannel.close();
      dataChannel = null;
    }

    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    isRemoteConnected.value = false;
    offerToken.value = "";
  }

  function handleRemoteCommand(rawMessage) {
    try {
      const payload = JSON.parse(rawMessage);
      if (payload?.command === "toggle-pause") {
        onTogglePause?.();
        return;
      }
      if (payload?.command === "next-slide") {
        onNextSlide?.();
        return;
      }
      if (payload?.command === "end-session") {
        onStopSession?.();
      }
    } catch {
      // Ignore malformed command payloads.
    }
  }

  function attachHostChannel(channel) {
    dataChannel = channel;
    dataChannel.onopen = () => {
      isRemoteConnected.value = true;
      remoteStatus.value = "Phone remote connected.";
    };
    dataChannel.onclose = () => {
      isRemoteConnected.value = false;
      remoteStatus.value = "Phone remote disconnected.";
    };
    dataChannel.onmessage = (event) => {
      handleRemoteCommand(event.data);
    };
  }

  async function createOfferToken() {
    if (!canUseWebRtc()) {
      remoteStatus.value = "WebRTC is not supported in this browser.";
      return;
    }

    closeHostConnection();
    peerConnection = buildPeerConnection();
    attachHostChannel(peerConnection.createDataChannel("figure-remote-control"));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    await waitForIceGatheringComplete(peerConnection);

    offerToken.value = encodeSignalPayload(peerConnection.localDescription);
    remoteStatus.value = "Offer ready. Paste it into the phone remote page.";
  }

  async function applyAnswerToken(answerToken) {
    if (!peerConnection) {
      remoteStatus.value = "Create an offer before applying an answer.";
      return;
    }

    try {
      const answerPayload = decodeSignalPayload(answerToken);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answerPayload));
      remoteStatus.value = "Answer applied. Waiting for phone to connect.";
    } catch {
      remoteStatus.value = "Invalid answer token.";
    }
  }

  function disconnectHostRemote() {
    closeHostConnection();
    remoteStatus.value = "Remote disconnected.";
  }

  onBeforeUnmount(() => {
    closeHostConnection();
  });

  return {
    remoteStatus,
    offerToken,
    isRemoteConnected: computed(() => isRemoteConnected.value),
    createOfferToken,
    applyAnswerToken,
    disconnectHostRemote
  };
}

export function usePhoneRemoteClient() {
  const remoteStatus = ref("Paste desktop offer to pair.");
  const answerToken = ref("");
  const isRemoteConnected = ref(false);

  let peerConnection = null;
  let dataChannel = null;

  function closeClientConnection() {
    if (dataChannel) {
      dataChannel.close();
      dataChannel = null;
    }

    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    isRemoteConnected.value = false;
  }

  function attachClientChannel(channel) {
    dataChannel = channel;
    dataChannel.onopen = () => {
      isRemoteConnected.value = true;
      remoteStatus.value = "Connected. Use controls below.";
    };
    dataChannel.onclose = () => {
      isRemoteConnected.value = false;
      remoteStatus.value = "Connection closed.";
    };
  }

  async function createAnswerToken(offerToken) {
    if (!canUseWebRtc()) {
      remoteStatus.value = "WebRTC is not supported in this browser.";
      return;
    }

    closeClientConnection();
    peerConnection = buildPeerConnection();
    peerConnection.ondatachannel = (event) => {
      attachClientChannel(event.channel);
    };

    try {
      const offerPayload = decodeSignalPayload(offerToken);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offerPayload));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      await waitForIceGatheringComplete(peerConnection);
      answerToken.value = encodeSignalPayload(peerConnection.localDescription);
      remoteStatus.value = "Answer ready. Paste it back on desktop.";
    } catch {
      remoteStatus.value = "Invalid desktop offer token.";
    }
  }

  function sendRemoteCommand(command) {
    if (!dataChannel || dataChannel.readyState !== "open") {
      remoteStatus.value = "Remote is not connected yet.";
      return;
    }

    dataChannel.send(JSON.stringify({ command }));
  }

  function disconnectClientRemote() {
    closeClientConnection();
    remoteStatus.value = "Remote disconnected.";
  }

  onBeforeUnmount(() => {
    closeClientConnection();
  });

  return {
    remoteStatus,
    answerToken,
    isRemoteConnected: computed(() => isRemoteConnected.value),
    createAnswerToken,
    sendRemoteCommand,
    disconnectClientRemote
  };
}
