import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const REMOTE_QUERY_PARAM = "remote";
const OFFER_QUERY_PARAM = "offer";

function canUseWebRtc() {
  return typeof window !== "undefined" && typeof window.RTCPeerConnection !== "undefined";
}

function canUseClipboard() {
  return typeof navigator !== "undefined" && Boolean(navigator.clipboard?.writeText);
}

async function writeClipboardText(rawText) {
  if (!canUseClipboard()) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(String(rawText || ""));
    return true;
  } catch {
    return false;
  }
}

export function readOfferTokenFromSearch(search) {
  try {
    const params = new URLSearchParams(String(search || ""));
    return String(params.get(OFFER_QUERY_PARAM) || "").trim();
  } catch {
    return "";
  }
}

export function buildRemotePairingUrl({ currentUrl, offerToken }) {
  const normalizedOfferToken = String(offerToken || "").trim();
  if (!normalizedOfferToken) {
    return "";
  }

  try {
    const url = new URL(String(currentUrl || ""));
    url.searchParams.set(REMOTE_QUERY_PARAM, "1");
    url.searchParams.set(OFFER_QUERY_PARAM, normalizedOfferToken);
    return url.toString();
  } catch {
    return "";
  }
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

async function renderQrCodeDataUrl(rawText) {
  const text = String(rawText || "").trim();
  if (!text) {
    return "";
  }

  try {
    const qrCodeModule = await import("qrcode");
    const toDataUrlFn = qrCodeModule.toDataURL || qrCodeModule.default?.toDataURL;
    if (typeof toDataUrlFn !== "function") {
      return "";
    }

    return await toDataUrlFn(text, {
      width: 224,
      margin: 1,
      errorCorrectionLevel: "M"
    });
  } catch {
    return "";
  }
}

export function usePhoneRemoteHost({
  onTogglePause,
  onNextSlide,
  onStopSession
}) {
  const remoteStatus = ref("Remote disconnected.");
  const offerToken = ref("");
  const isRemoteConnected = ref(false);
  const pairingUrl = ref("");
  const pairingQrDataUrl = ref("");

  let peerConnection = null;
  let dataChannel = null;
  let qrRenderRequestId = 0;

  function clearPairingArtifacts() {
    qrRenderRequestId += 1;
    pairingUrl.value = "";
    pairingQrDataUrl.value = "";
  }

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
    clearPairingArtifacts();
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

  async function refreshPairingArtifacts() {
    const nextPairingUrl = buildRemotePairingUrl({
      currentUrl: typeof window !== "undefined" ? window.location.href : "",
      offerToken: offerToken.value
    });

    pairingUrl.value = nextPairingUrl;
    pairingQrDataUrl.value = "";

    if (!nextPairingUrl) {
      return;
    }

    const requestId = ++qrRenderRequestId;
    const nextQrDataUrl = await renderQrCodeDataUrl(nextPairingUrl);
    if (requestId !== qrRenderRequestId) {
      return;
    }

    pairingQrDataUrl.value = nextQrDataUrl;
  }

  async function copyHostOfferToken() {
    if (!offerToken.value) {
      remoteStatus.value = "Generate an offer before copying a token.";
      return;
    }

    const copied = await writeClipboardText(offerToken.value);
    remoteStatus.value = copied
      ? "Offer token copied."
      : "Clipboard access is unavailable. Copy the token manually.";
  }

  async function copyHostPairingLink() {
    if (!pairingUrl.value) {
      remoteStatus.value = "Generate an offer before copying a pairing link.";
      return;
    }

    const copied = await writeClipboardText(pairingUrl.value);
    remoteStatus.value = copied
      ? "Pairing link copied."
      : "Clipboard access is unavailable. Copy the pairing link manually.";
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
    await refreshPairingArtifacts();
    remoteStatus.value = "Offer ready. Share pairing link/QR with your phone.";
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
    pairingUrl,
    pairingQrDataUrl,
    isRemoteConnected: computed(() => isRemoteConnected.value),
    createOfferToken,
    applyAnswerToken,
    copyHostOfferToken,
    copyHostPairingLink,
    disconnectHostRemote
  };
}

export function usePhoneRemoteClient() {
  const remoteStatus = ref("Paste desktop offer to pair, or open a pairing link.");
  const answerToken = ref("");
  const isRemoteConnected = ref(false);
  const initialOfferToken = ref(
    typeof window === "undefined" ? "" : readOfferTokenFromSearch(window.location.search)
  );

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

  async function createAnswerToken(offerToken, options = {}) {
    if (!canUseWebRtc()) {
      remoteStatus.value = "WebRTC is not supported in this browser.";
      return;
    }

    const normalizedOfferToken = String(offerToken || "").trim();
    if (!normalizedOfferToken) {
      remoteStatus.value = "Paste a desktop offer token first.";
      return;
    }

    const source = options.source === "pair-link" ? "pair-link" : "manual";
    closeClientConnection();
    peerConnection = buildPeerConnection();
    peerConnection.ondatachannel = (event) => {
      attachClientChannel(event.channel);
    };

    try {
      const offerPayload = decodeSignalPayload(normalizedOfferToken);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offerPayload));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      await waitForIceGatheringComplete(peerConnection);
      answerToken.value = encodeSignalPayload(peerConnection.localDescription);
      remoteStatus.value =
        source === "pair-link"
          ? "Answer ready from pairing link. Copy it back to desktop."
          : "Answer ready. Paste it back on desktop.";
    } catch {
      remoteStatus.value =
        source === "pair-link"
          ? "Pairing link is invalid or expired. Request a new one from desktop."
          : "Invalid desktop offer token.";
    }
  }

  async function copyAnswerToken() {
    if (!answerToken.value) {
      remoteStatus.value = "Generate an answer token before copying.";
      return;
    }

    const copied = await writeClipboardText(answerToken.value);
    remoteStatus.value = copied
      ? "Answer token copied."
      : "Clipboard access is unavailable. Copy the answer token manually.";
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

  onMounted(() => {
    if (!initialOfferToken.value) {
      return;
    }

    remoteStatus.value = "Pairing link detected. Generating answer token...";
    void createAnswerToken(initialOfferToken.value, { source: "pair-link" });
  });

  return {
    remoteStatus,
    answerToken,
    initialOfferToken: computed(() => initialOfferToken.value),
    isRemoteConnected: computed(() => isRemoteConnected.value),
    createAnswerToken,
    copyAnswerToken,
    sendRemoteCommand,
    disconnectClientRemote
  };
}
