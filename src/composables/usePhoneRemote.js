import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const REMOTE_QUERY_PARAM = "remote";
const OFFER_QUERY_PARAM = "offer";
const SIGNAL_QUERY_PARAM = "signal";
const DEFAULT_STUN_SERVER_URL = "stun:stun.l.google.com:19302";
const REMOTE_RECONNECT_TIMEOUT_MS = 10000;
const ICE_GATHERING_TIMEOUT_MS = 6000;
const DEFAULT_SIGNALING_POLL_INTERVAL_MS = 1500;
const DEFAULT_SIGNALING_TIMEOUT_MS = 5000;
const DIAGNOSTIC_STATE_UNKNOWN = "n/a";

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

function normalizeText(rawValue) {
  return String(rawValue || "").trim();
}

function normalizeDiagnosticsState(rawState) {
  const normalizedState = normalizeText(rawState).toLowerCase();
  return normalizedState || DIAGNOSTIC_STATE_UNKNOWN;
}

function normalizeIceServerUrls(rawUrls) {
  const urls = [];
  const dedupedUrls = new Set();
  const pieces = Array.isArray(rawUrls)
    ? rawUrls
    : normalizeText(rawUrls)
        .split(/[\s,]+/)
        .filter(Boolean);

  for (const rawPiece of pieces) {
    const normalizedPiece = normalizeText(rawPiece);
    if (!normalizedPiece || dedupedUrls.has(normalizedPiece)) {
      continue;
    }

    dedupedUrls.add(normalizedPiece);
    urls.push(normalizedPiece);
  }

  return urls;
}

function hasTurnIceServer(iceServers) {
  return Array.from(iceServers || []).some((iceServer) => {
    const urls = Array.isArray(iceServer?.urls) ? iceServer.urls : [iceServer?.urls];
    return urls.some((url) => normalizeText(url).toLowerCase().startsWith("turn:"));
  });
}

function readRemoteEnv(overrides) {
  if (overrides && typeof overrides === "object") {
    return overrides;
  }

  return import.meta.env || {};
}

function parsePositiveInteger(rawValue, fallbackValue) {
  const parsedValue = Number.parseInt(String(rawValue), 10);
  if (Number.isNaN(parsedValue) || parsedValue <= 0) {
    return fallbackValue;
  }

  return parsedValue;
}

function normalizeSignalingSessionId(rawSessionId) {
  return normalizeText(rawSessionId);
}

function buildSignalingEndpointUrl({ endpoint, pathname = "" }) {
  const normalizedEndpoint = normalizeText(endpoint);
  if (!normalizedEndpoint) {
    return "";
  }

  try {
    const baseUrl = new URL(
      normalizedEndpoint.endsWith("/") ? normalizedEndpoint : `${normalizedEndpoint}/`
    );
    const normalizedPathname = String(pathname || "")
      .split("/")
      .map((part, index) => {
        if (index === 0 && part === "") {
          return "";
        }
        return encodeURIComponent(part);
      })
      .join("/");
    return new URL(normalizedPathname, baseUrl).toString();
  } catch {
    return "";
  }
}

function getFetchImpl() {
  if (typeof fetch !== "function") {
    return null;
  }

  return fetch;
}

async function requestJson(url, options = {}) {
  const fetchImpl = getFetchImpl();
  if (!fetchImpl) {
    throw new Error("fetch-unavailable");
  }

  const headers = {
    Accept: "application/json",
    ...options.headers
  };

  const timeoutMs = parsePositiveInteger(options.timeoutMs, DEFAULT_SIGNALING_TIMEOUT_MS);
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId =
    controller !== null
      ? setTimeout(() => {
          controller.abort();
        }, timeoutMs)
      : null;

  try {
    const response = await fetchImpl(url, {
      ...options,
      headers,
      signal: controller?.signal
    });
    if (!response.ok) {
      throw new Error(`request-failed-${response.status}`);
    }

    return await response.json();
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
}

export function buildRemoteIceServers(options = {}) {
  const env = readRemoteEnv(options.env);
  const turnUrls = normalizeIceServerUrls(
    options.turnUrl ?? env.VITE_TURN_URL ?? env.TURN_URL
  );
  const turnUsername = normalizeText(
    options.turnUsername ?? env.VITE_TURN_USERNAME ?? env.TURN_USERNAME
  );
  const turnCredential = normalizeText(
    options.turnCredential ?? env.VITE_TURN_CREDENTIAL ?? env.TURN_CREDENTIAL
  );

  const iceServers = [{ urls: DEFAULT_STUN_SERVER_URL }];

  if (turnUrls.length > 0 && turnUsername && turnCredential) {
    iceServers.push({
      urls: turnUrls.length === 1 ? turnUrls[0] : turnUrls,
      username: turnUsername,
      credential: turnCredential
    });
  }

  return iceServers;
}

export function buildRemoteSignalingConfig(options = {}) {
  const env = readRemoteEnv(options.env);
  const endpoint = normalizeText(
    options.endpoint ?? env.VITE_REMOTE_SIGNALING_ENDPOINT ?? env.REMOTE_SIGNALING_ENDPOINT
  );
  const pollIntervalMs = parsePositiveInteger(
    options.pollIntervalMs ?? env.VITE_REMOTE_SIGNALING_POLL_MS ?? env.REMOTE_SIGNALING_POLL_MS,
    DEFAULT_SIGNALING_POLL_INTERVAL_MS
  );
  const requestTimeoutMs = parsePositiveInteger(
    options.requestTimeoutMs ??
      env.VITE_REMOTE_SIGNALING_TIMEOUT_MS ??
      env.REMOTE_SIGNALING_TIMEOUT_MS,
    DEFAULT_SIGNALING_TIMEOUT_MS
  );

  return {
    enabled: Boolean(endpoint),
    endpoint,
    pollIntervalMs,
    requestTimeoutMs
  };
}

export function deriveRemoteDiagnostics(options = {}) {
  const connectionState = normalizeDiagnosticsState(options.connectionState);
  const iceConnectionState = normalizeDiagnosticsState(options.iceConnectionState);
  const dataChannelState = normalizeDiagnosticsState(options.dataChannelState);
  const hasOfferToken = Boolean(options.hasOfferToken);
  const isRemoteConnected = Boolean(options.isRemoteConnected);
  const reconnectTimedOut = Boolean(options.reconnectTimedOut);
  const hasTurnServer = Boolean(options.hasTurnServer);

  let category = "idle";
  let statusLabel = "Idle";
  let hint = hasOfferToken
    ? "Offer ready. Apply answer token from phone to connect."
    : "Generate an offer token to start phone pairing.";
  let errorCategory = "none";
  let retryRecommended = false;

  const isDisconnectedState =
    connectionState === "disconnected" || iceConnectionState === "disconnected";
  const isConnectingState =
    connectionState === "new" ||
    connectionState === "connecting" ||
    iceConnectionState === "new" ||
    iceConnectionState === "checking" ||
    dataChannelState === "connecting";
  const isFailedState = connectionState === "failed" || iceConnectionState === "failed";
  const isClosedState = connectionState === "closed" || dataChannelState === "closed";

  if (
    isRemoteConnected ||
    dataChannelState === "open" ||
    connectionState === "connected" ||
    iceConnectionState === "connected" ||
    iceConnectionState === "completed"
  ) {
    category = "connected";
    statusLabel = "Connected";
    hint = hasTurnServer
      ? "Connected. TURN fallback is configured for stricter networks."
      : "Connected. Configure TURN fallback if pairing is unreliable on mobile networks.";
  } else if (isFailedState) {
    category = "error";
    statusLabel = "Connection Failed";
    hint = "Connection failed. Retry reconnect to refresh the offer and request a new answer token.";
    errorCategory = "connection-failed";
    retryRecommended = true;
  } else if (isDisconnectedState) {
    category = reconnectTimedOut ? "error" : "reconnecting";
    statusLabel = reconnectTimedOut ? "Reconnect Timed Out" : "Reconnecting";
    hint = reconnectTimedOut
      ? "Reconnect timed out. Retry reconnect to refresh the offer for phone."
      : "Transient disconnect detected. Waiting for automatic recovery.";
    errorCategory = reconnectTimedOut ? "reconnect-timeout" : "transient-disconnect";
    retryRecommended = reconnectTimedOut;
  } else if (isConnectingState && hasOfferToken) {
    category = "connecting";
    statusLabel = "Connecting";
    hint = "Waiting for phone answer token and data channel open.";
  } else if (isClosedState && hasOfferToken) {
    category = "error";
    statusLabel = "Connection Closed";
    hint = "Connection closed. Retry reconnect or generate a new offer.";
    errorCategory = "connection-closed";
    retryRecommended = true;
  }

  const explicitErrorCategory = normalizeText(options.errorCategory).toLowerCase();
  const explicitErrorHint = normalizeText(options.errorHint);
  if (explicitErrorCategory) {
    category = "error";
    statusLabel = "Connection Error";
    errorCategory = explicitErrorCategory;
    retryRecommended = true;
    if (explicitErrorHint) {
      hint = explicitErrorHint;
    }
  } else if (explicitErrorHint) {
    hint = explicitErrorHint;
  }

  return {
    category,
    statusLabel,
    hint,
    errorCategory,
    retryRecommended,
    turnFallbackEnabled: hasTurnServer,
    connectionState,
    iceConnectionState,
    dataChannelState
  };
}

export function readOfferTokenFromSearch(search) {
  try {
    const params = new URLSearchParams(String(search || ""));
    return String(params.get(OFFER_QUERY_PARAM) || "").trim();
  } catch {
    return "";
  }
}

export function readSignalingSessionIdFromSearch(search) {
  try {
    const params = new URLSearchParams(String(search || ""));
    return normalizeSignalingSessionId(params.get(SIGNAL_QUERY_PARAM));
  } catch {
    return "";
  }
}

export function buildRemotePairingUrl({ currentUrl, offerToken, signalSessionId }) {
  const normalizedOfferToken = String(offerToken || "").trim();
  const normalizedSignalSessionId = normalizeSignalingSessionId(signalSessionId);
  if (!normalizedOfferToken && !normalizedSignalSessionId) {
    return "";
  }

  try {
    const url = new URL(String(currentUrl || ""));
    url.searchParams.set(REMOTE_QUERY_PARAM, "1");

    if (normalizedSignalSessionId) {
      url.searchParams.set(SIGNAL_QUERY_PARAM, normalizedSignalSessionId);
      url.searchParams.delete(OFFER_QUERY_PARAM);
      return url.toString();
    }

    url.searchParams.set(OFFER_QUERY_PARAM, normalizedOfferToken);
    url.searchParams.delete(SIGNAL_QUERY_PARAM);
    return url.toString();
  } catch {
    return "";
  }
}

async function createSignalingSession({ endpoint, offerToken, requestTimeoutMs }) {
  const sessionUrl = buildSignalingEndpointUrl({
    endpoint,
    pathname: "sessions"
  });
  if (!sessionUrl) {
    throw new Error("invalid-signaling-endpoint");
  }

  const payload = await requestJson(sessionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      offerToken: normalizeText(offerToken)
    }),
    timeoutMs: requestTimeoutMs
  });

  const sessionId = normalizeSignalingSessionId(payload?.sessionId);
  if (!sessionId) {
    throw new Error("missing-signaling-session-id");
  }

  return {
    sessionId
  };
}

async function readSignalingSession({ endpoint, sessionId, requestTimeoutMs }) {
  const normalizedSessionId = normalizeSignalingSessionId(sessionId);
  if (!normalizedSessionId) {
    throw new Error("missing-signaling-session-id");
  }

  const sessionUrl = buildSignalingEndpointUrl({
    endpoint,
    pathname: `sessions/${normalizedSessionId}`
  });
  if (!sessionUrl) {
    throw new Error("invalid-signaling-endpoint");
  }

  return await requestJson(sessionUrl, {
    timeoutMs: requestTimeoutMs
  });
}

async function writeSignalingAnswer({ endpoint, sessionId, answerToken, requestTimeoutMs }) {
  const normalizedSessionId = normalizeSignalingSessionId(sessionId);
  if (!normalizedSessionId) {
    throw new Error("missing-signaling-session-id");
  }

  const answerUrl = buildSignalingEndpointUrl({
    endpoint,
    pathname: `sessions/${normalizedSessionId}/answer`
  });
  if (!answerUrl) {
    throw new Error("invalid-signaling-endpoint");
  }

  await requestJson(answerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      answerToken: normalizeText(answerToken)
    }),
    timeoutMs: requestTimeoutMs
  });
}

function encodeSignalPayload(payload) {
  const json = JSON.stringify(payload);
  return btoa(encodeURIComponent(json));
}

function decodeSignalPayload(token) {
  const decoded = decodeURIComponent(atob(String(token || "").trim()));
  return JSON.parse(decoded);
}

function waitForIceGatheringComplete(peerConnection, timeoutMs = ICE_GATHERING_TIMEOUT_MS) {
  if (peerConnection.iceGatheringState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let timeoutId = null;

    function finish() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      peerConnection.removeEventListener("icegatheringstatechange", handleStateChange);
      resolve();
    }

    function handleStateChange() {
      if (peerConnection.iceGatheringState === "complete") {
        finish();
      }
    }

    timeoutId = setTimeout(() => {
      finish();
    }, timeoutMs);

    peerConnection.addEventListener("icegatheringstatechange", handleStateChange);
  });
}

function buildPeerConnection({ iceServers }) {
  return new RTCPeerConnection({
    iceServers
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
  const signalSessionId = ref("");

  const iceServers = buildRemoteIceServers();
  const signalingConfig = buildRemoteSignalingConfig();
  const turnFallbackEnabled = hasTurnIceServer(iceServers);
  const remoteDiagnostics = ref(
    deriveRemoteDiagnostics({
      hasTurnServer: turnFallbackEnabled
    })
  );

  let peerConnection = null;
  let dataChannel = null;
  let qrRenderRequestId = 0;
  let reconnectTimeoutId = null;
  let reconnectTimedOut = false;
  let diagnosticsErrorCategory = "";
  let diagnosticsErrorHint = "";
  let signalingPollIntervalId = null;
  let isPollingForSignalingAnswer = false;
  let lastSignalingAnswerToken = "";

  function clearPairingArtifacts() {
    qrRenderRequestId += 1;
    pairingUrl.value = "";
    pairingQrDataUrl.value = "";
  }

  function clearSignalingSession() {
    signalSessionId.value = "";
    lastSignalingAnswerToken = "";
  }

  function stopSignalingAnswerPolling() {
    if (signalingPollIntervalId !== null) {
      clearInterval(signalingPollIntervalId);
      signalingPollIntervalId = null;
    }
    isPollingForSignalingAnswer = false;
  }

  function clearReconnectTimeout({ resetTimedOut = false } = {}) {
    if (reconnectTimeoutId !== null) {
      clearTimeout(reconnectTimeoutId);
      reconnectTimeoutId = null;
    }

    if (resetTimedOut) {
      reconnectTimedOut = false;
    }
  }

  function clearDiagnosticsError() {
    diagnosticsErrorCategory = "";
    diagnosticsErrorHint = "";
  }

  function setDiagnosticsError(errorCategory, errorHint) {
    diagnosticsErrorCategory = normalizeText(errorCategory).toLowerCase();
    diagnosticsErrorHint = normalizeText(errorHint);
    syncHostDiagnostics();
  }

  function syncHostDiagnostics() {
    remoteDiagnostics.value = deriveRemoteDiagnostics({
      connectionState: peerConnection?.connectionState,
      iceConnectionState: peerConnection?.iceConnectionState,
      dataChannelState: dataChannel?.readyState,
      hasOfferToken: Boolean(offerToken.value),
      isRemoteConnected: isRemoteConnected.value,
      reconnectTimedOut,
      hasTurnServer: turnFallbackEnabled,
      errorCategory: diagnosticsErrorCategory,
      errorHint: diagnosticsErrorHint
    });
  }

  function startReconnectTimeout() {
    if (reconnectTimeoutId !== null || isRemoteConnected.value) {
      return;
    }

    reconnectTimeoutId = setTimeout(() => {
      reconnectTimeoutId = null;
      reconnectTimedOut = true;

      if (!isRemoteConnected.value) {
        remoteStatus.value = "Reconnect timed out. Retry reconnect to refresh the offer.";
      }

      syncHostDiagnostics();
    }, REMOTE_RECONNECT_TIMEOUT_MS);
  }

  function isPeerConnectionDisconnected() {
    const connectionState = normalizeDiagnosticsState(peerConnection?.connectionState);
    const iceConnectionState = normalizeDiagnosticsState(peerConnection?.iceConnectionState);

    return connectionState === "disconnected" || iceConnectionState === "disconnected";
  }

  function isPeerConnectionFailedOrClosed() {
    const connectionState = normalizeDiagnosticsState(peerConnection?.connectionState);
    const iceConnectionState = normalizeDiagnosticsState(peerConnection?.iceConnectionState);

    return (
      connectionState === "failed" ||
      connectionState === "closed" ||
      iceConnectionState === "failed" ||
      iceConnectionState === "closed"
    );
  }

  function handleHostConnectionStateChange() {
    if (isRemoteConnected.value) {
      clearReconnectTimeout({ resetTimedOut: true });
      clearDiagnosticsError();
      syncHostDiagnostics();
      return;
    }

    if (isPeerConnectionDisconnected()) {
      if (!reconnectTimeoutId) {
        remoteStatus.value = "Transient disconnect detected. Attempting auto-reconnect.";
      }
      startReconnectTimeout();
      syncHostDiagnostics();
      return;
    }

    if (isPeerConnectionFailedOrClosed()) {
      clearReconnectTimeout();
      reconnectTimedOut = true;
      setDiagnosticsError(
        "connection-failed",
        "Connection failed. Retry reconnect or generate a fresh offer token."
      );
      remoteStatus.value = "Connection failed. Retry reconnect or generate a new offer.";
      return;
    }

    syncHostDiagnostics();
  }

  function attachHostPeerConnection(nextPeerConnection) {
    peerConnection = nextPeerConnection;
    peerConnection.onconnectionstatechange = () => {
      handleHostConnectionStateChange();
    };
    peerConnection.oniceconnectionstatechange = () => {
      handleHostConnectionStateChange();
    };
  }

  function closeHostConnection({ resetOfferToken = true } = {}) {
    clearReconnectTimeout({ resetTimedOut: true });
    stopSignalingAnswerPolling();

    if (dataChannel) {
      dataChannel.close();
      dataChannel = null;
    }

    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    isRemoteConnected.value = false;

    if (resetOfferToken) {
      offerToken.value = "";
      clearSignalingSession();
      clearPairingArtifacts();
    }

    clearDiagnosticsError();
    syncHostDiagnostics();
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
      clearReconnectTimeout({ resetTimedOut: true });
      stopSignalingAnswerPolling();
      clearDiagnosticsError();
      remoteStatus.value = "Phone remote connected.";
      syncHostDiagnostics();
    };
    dataChannel.onclose = () => {
      isRemoteConnected.value = false;
      if (peerConnection && isPeerConnectionDisconnected()) {
        remoteStatus.value = "Phone connection dropped. Waiting for automatic reconnect.";
        startReconnectTimeout();
      } else {
        remoteStatus.value = "Phone remote disconnected.";
      }
      syncHostDiagnostics();
    };
    dataChannel.onerror = () => {
      setDiagnosticsError(
        "data-channel-error",
        "Control channel error. Retry reconnect if commands stop responding."
      );
      remoteStatus.value = "Remote channel error. Retry reconnect if needed.";
    };
    dataChannel.onmessage = (event) => {
      handleRemoteCommand(event.data);
    };

    syncHostDiagnostics();
  }

  async function initializeSignalingSession() {
    clearSignalingSession();
    if (!signalingConfig.enabled || !offerToken.value) {
      return {
        enabled: signalingConfig.enabled,
        sessionReady: false
      };
    }

    try {
      const session = await createSignalingSession({
        endpoint: signalingConfig.endpoint,
        offerToken: offerToken.value,
        requestTimeoutMs: signalingConfig.requestTimeoutMs
      });
      signalSessionId.value = session.sessionId;
      return {
        enabled: true,
        sessionReady: true
      };
    } catch {
      clearSignalingSession();
      return {
        enabled: true,
        sessionReady: false
      };
    }
  }

  function startSignalingAnswerPolling() {
    stopSignalingAnswerPolling();
    if (!signalingConfig.enabled || !peerConnection || !signalSessionId.value) {
      return;
    }

    const pollForAnswer = async () => {
      if (!peerConnection || isRemoteConnected.value || isPollingForSignalingAnswer) {
        return;
      }

      isPollingForSignalingAnswer = true;
      try {
        const session = await readSignalingSession({
          endpoint: signalingConfig.endpoint,
          sessionId: signalSessionId.value,
          requestTimeoutMs: signalingConfig.requestTimeoutMs
        });
        const nextAnswerToken = normalizeText(session?.answerToken);
        if (!nextAnswerToken || nextAnswerToken === lastSignalingAnswerToken) {
          return;
        }

        lastSignalingAnswerToken = nextAnswerToken;
        await applyAnswerToken(nextAnswerToken, { source: "signaling" });
      } catch {
        // Preserve local/manual pairing even if signaling polling fails.
      } finally {
        isPollingForSignalingAnswer = false;
      }
    };

    void pollForAnswer();
    signalingPollIntervalId = setInterval(() => {
      void pollForAnswer();
    }, signalingConfig.pollIntervalMs);
  }

  async function refreshPairingArtifacts() {
    const nextPairingUrl = buildRemotePairingUrl({
      currentUrl: typeof window !== "undefined" ? window.location.href : "",
      offerToken: offerToken.value,
      signalSessionId: signalSessionId.value
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
      setDiagnosticsError("webrtc-unsupported", "This browser does not support WebRTC.");
      return;
    }

    closeHostConnection();

    try {
      attachHostPeerConnection(buildPeerConnection({ iceServers }));
      attachHostChannel(peerConnection.createDataChannel("figure-remote-control"));

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      await waitForIceGatheringComplete(peerConnection);

      offerToken.value = encodeSignalPayload(peerConnection.localDescription);
      const signalingSession = await initializeSignalingSession();
      await refreshPairingArtifacts();
      if (signalingSession.sessionReady) {
        startSignalingAnswerPolling();
        remoteStatus.value = turnFallbackEnabled
          ? "Offer ready. Share pairing link/QR with phone (TURN + signaling enabled)."
          : "Offer ready. Share pairing link/QR with phone (auto-answer signaling enabled).";
      } else if (signalingSession.enabled) {
        remoteStatus.value =
          "Offer ready. Signaling unavailable, so apply answer token manually.";
      } else {
        remoteStatus.value = turnFallbackEnabled
          ? "Offer ready. Share pairing link/QR with phone (TURN fallback enabled)."
          : "Offer ready. Share pairing link/QR with your phone.";
      }
      clearDiagnosticsError();
      syncHostDiagnostics();
    } catch {
      closeHostConnection();
      remoteStatus.value = "Unable to generate offer token. Check network/browser settings.";
      setDiagnosticsError("offer-generation-failed", "Offer generation failed.");
    }
  }

  async function applyAnswerToken(answerToken, options = {}) {
    const source = options.source === "signaling" ? "signaling" : "manual";

    if (!peerConnection) {
      remoteStatus.value = "Create an offer before applying an answer.";
      return;
    }

    const normalizedAnswerToken = normalizeText(answerToken);
    if (!normalizedAnswerToken) {
      remoteStatus.value =
        source === "signaling"
          ? "Waiting for answer from signaling relay."
          : "Paste an answer token from phone first.";
      return;
    }

    try {
      const answerPayload = decodeSignalPayload(normalizedAnswerToken);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answerPayload));
      clearReconnectTimeout({ resetTimedOut: true });
      clearDiagnosticsError();
      remoteStatus.value =
        source === "signaling"
          ? "Answer applied from signaling relay. Waiting for phone to connect."
          : "Answer applied. Waiting for phone to connect.";
      syncHostDiagnostics();
    } catch {
      remoteStatus.value =
        source === "signaling"
          ? "Signaling answer is invalid. Retry reconnect or apply manual answer token."
          : "Invalid answer token. Check copy/paste and retry.";
      setDiagnosticsError("invalid-answer-token", "Answer token is invalid.");
    }
  }

  async function retryHostReconnect() {
    if (!peerConnection) {
      remoteStatus.value = "Create an offer before retrying reconnect.";
      return;
    }

    try {
      clearReconnectTimeout({ resetTimedOut: true });
      clearDiagnosticsError();

      if (typeof peerConnection.restartIce === "function") {
        peerConnection.restartIce();
      }

      const reconnectOffer = await peerConnection.createOffer({ iceRestart: true });
      await peerConnection.setLocalDescription(reconnectOffer);
      await waitForIceGatheringComplete(peerConnection);

      offerToken.value = encodeSignalPayload(peerConnection.localDescription);
      const signalingSession = await initializeSignalingSession();
      await refreshPairingArtifacts();
      startReconnectTimeout();
      if (signalingSession.sessionReady) {
        startSignalingAnswerPolling();
        remoteStatus.value = "Reconnect offer ready. Waiting for phone answer via signaling.";
      } else if (signalingSession.enabled) {
        remoteStatus.value =
          "Reconnect offer ready. Signaling unavailable; generate a new answer token on phone.";
      } else {
        remoteStatus.value = "Reconnect offer ready. Generate a new answer token on phone.";
      }
      syncHostDiagnostics();
    } catch {
      remoteStatus.value = "Unable to retry reconnect. Generate a fresh offer token.";
      setDiagnosticsError(
        "reconnect-retry-failed",
        "Reconnect retry failed. Generate a new offer and pair again."
      );
    }
  }

  function disconnectHostRemote() {
    closeHostConnection();
    remoteStatus.value = "Remote disconnected.";
    syncHostDiagnostics();
  }

  onBeforeUnmount(() => {
    closeHostConnection();
  });

  return {
    remoteStatus,
    remoteDiagnostics,
    offerToken,
    pairingUrl,
    pairingQrDataUrl,
    isRemoteConnected: computed(() => isRemoteConnected.value),
    createOfferToken,
    applyAnswerToken,
    retryHostReconnect,
    copyHostOfferToken,
    copyHostPairingLink,
    disconnectHostRemote
  };
}

export function usePhoneRemoteClient() {
  const remoteStatus = ref("Paste desktop offer to pair, or open a pairing link.");
  const answerToken = ref("");
  const isRemoteConnected = ref(false);
  const initialSignalSessionId = ref(
    typeof window === "undefined"
      ? ""
      : readSignalingSessionIdFromSearch(window.location.search)
  );
  const initialOfferToken = ref(
    typeof window === "undefined" ? "" : readOfferTokenFromSearch(window.location.search)
  );

  const iceServers = buildRemoteIceServers();
  const signalingConfig = buildRemoteSignalingConfig();
  const turnFallbackEnabled = hasTurnIceServer(iceServers);
  const remoteDiagnostics = ref(
    deriveRemoteDiagnostics({
      hasTurnServer: turnFallbackEnabled
    })
  );

  let peerConnection = null;
  let dataChannel = null;
  let reconnectTimeoutId = null;
  let reconnectTimedOut = false;
  let diagnosticsErrorCategory = "";
  let diagnosticsErrorHint = "";
  let lastDesktopOfferToken = "";

  function clearReconnectTimeout({ resetTimedOut = false } = {}) {
    if (reconnectTimeoutId !== null) {
      clearTimeout(reconnectTimeoutId);
      reconnectTimeoutId = null;
    }

    if (resetTimedOut) {
      reconnectTimedOut = false;
    }
  }

  function clearDiagnosticsError() {
    diagnosticsErrorCategory = "";
    diagnosticsErrorHint = "";
  }

  function setDiagnosticsError(errorCategory, errorHint) {
    diagnosticsErrorCategory = normalizeText(errorCategory).toLowerCase();
    diagnosticsErrorHint = normalizeText(errorHint);
    syncClientDiagnostics();
  }

  function syncClientDiagnostics() {
    remoteDiagnostics.value = deriveRemoteDiagnostics({
      connectionState: peerConnection?.connectionState,
      iceConnectionState: peerConnection?.iceConnectionState,
      dataChannelState: dataChannel?.readyState,
      hasOfferToken: Boolean(lastDesktopOfferToken),
      isRemoteConnected: isRemoteConnected.value,
      reconnectTimedOut,
      hasTurnServer: turnFallbackEnabled,
      errorCategory: diagnosticsErrorCategory,
      errorHint: diagnosticsErrorHint
    });
  }

  function isClientConnectionDisconnected() {
    const connectionState = normalizeDiagnosticsState(peerConnection?.connectionState);
    const iceConnectionState = normalizeDiagnosticsState(peerConnection?.iceConnectionState);
    return connectionState === "disconnected" || iceConnectionState === "disconnected";
  }

  function isClientConnectionFailedOrClosed() {
    const connectionState = normalizeDiagnosticsState(peerConnection?.connectionState);
    const iceConnectionState = normalizeDiagnosticsState(peerConnection?.iceConnectionState);
    return (
      connectionState === "failed" ||
      connectionState === "closed" ||
      iceConnectionState === "failed" ||
      iceConnectionState === "closed"
    );
  }

  function startReconnectTimeout() {
    if (reconnectTimeoutId !== null || isRemoteConnected.value) {
      return;
    }

    reconnectTimeoutId = setTimeout(() => {
      reconnectTimeoutId = null;
      reconnectTimedOut = true;
      if (!isRemoteConnected.value) {
        remoteStatus.value = "Reconnect timed out. Use Retry Connection.";
      }
      syncClientDiagnostics();
    }, REMOTE_RECONNECT_TIMEOUT_MS);
  }

  function handleClientConnectionStateChange() {
    if (isRemoteConnected.value) {
      clearReconnectTimeout({ resetTimedOut: true });
      clearDiagnosticsError();
      syncClientDiagnostics();
      return;
    }

    if (isClientConnectionDisconnected()) {
      if (!reconnectTimeoutId) {
        remoteStatus.value = "Connection interrupted. Waiting for auto-reconnect.";
      }
      startReconnectTimeout();
      syncClientDiagnostics();
      return;
    }

    if (isClientConnectionFailedOrClosed()) {
      clearReconnectTimeout();
      reconnectTimedOut = true;
      setDiagnosticsError(
        "connection-failed",
        "Connection failed. Retry with the latest desktop offer token."
      );
      remoteStatus.value = "Connection failed. Retry pairing with desktop.";
      return;
    }

    syncClientDiagnostics();
  }

  function attachClientPeerConnection(nextPeerConnection) {
    peerConnection = nextPeerConnection;
    peerConnection.onconnectionstatechange = () => {
      handleClientConnectionStateChange();
    };
    peerConnection.oniceconnectionstatechange = () => {
      handleClientConnectionStateChange();
    };
  }

  function closeClientConnection() {
    clearReconnectTimeout({ resetTimedOut: true });

    if (dataChannel) {
      dataChannel.close();
      dataChannel = null;
    }

    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    isRemoteConnected.value = false;
    clearDiagnosticsError();
    syncClientDiagnostics();
  }

  function attachClientChannel(channel) {
    dataChannel = channel;
    dataChannel.onopen = () => {
      isRemoteConnected.value = true;
      clearReconnectTimeout({ resetTimedOut: true });
      clearDiagnosticsError();
      remoteStatus.value = "Connected. Use controls below.";
      syncClientDiagnostics();
    };
    dataChannel.onclose = () => {
      isRemoteConnected.value = false;
      if (peerConnection && isClientConnectionDisconnected()) {
        remoteStatus.value = "Connection dropped. Waiting for auto-reconnect.";
        startReconnectTimeout();
      } else {
        remoteStatus.value = "Connection closed.";
      }
      syncClientDiagnostics();
    };
    dataChannel.onerror = () => {
      setDiagnosticsError(
        "data-channel-error",
        "Control channel error. Retry pairing if commands stop responding."
      );
      remoteStatus.value = "Control channel error. Retry pairing if needed.";
    };
    syncClientDiagnostics();
  }

  async function createAnswerFromSignalingSession(rawSessionId) {
    if (!signalingConfig.enabled) {
      remoteStatus.value = "Signaling link detected, but signaling is not configured here.";
      return;
    }

    const sessionId = normalizeSignalingSessionId(rawSessionId);
    if (!sessionId) {
      remoteStatus.value = "Signaling link is invalid. Request a fresh pairing link.";
      return;
    }

    remoteStatus.value = "Signaling link detected. Fetching desktop offer...";
    try {
      const session = await readSignalingSession({
        endpoint: signalingConfig.endpoint,
        sessionId,
        requestTimeoutMs: signalingConfig.requestTimeoutMs
      });
      const sessionOfferToken = normalizeText(session?.offerToken);
      if (!sessionOfferToken) {
        remoteStatus.value = "Signaling session is missing desktop offer. Retry from desktop.";
        setDiagnosticsError(
          "signaling-offer-missing",
          "No offer is available in this signaling session yet."
        );
        return;
      }

      await createAnswerToken(sessionOfferToken, { source: "signaling" });
      if (!answerToken.value) {
        return;
      }

      await writeSignalingAnswer({
        endpoint: signalingConfig.endpoint,
        sessionId,
        answerToken: answerToken.value,
        requestTimeoutMs: signalingConfig.requestTimeoutMs
      });
      clearDiagnosticsError();
      syncClientDiagnostics();
      remoteStatus.value = "Answer sent via signaling. Waiting for desktop connection.";
    } catch {
      remoteStatus.value =
        "Unable to use signaling service. Paste desktop offer token and pair manually.";
      setDiagnosticsError(
        "signaling-unavailable",
        "Signaling service is unavailable. Use manual token pairing."
      );
    }
  }

  async function createAnswerToken(offerToken, options = {}) {
    if (!canUseWebRtc()) {
      remoteStatus.value = "WebRTC is not supported in this browser.";
      setDiagnosticsError("webrtc-unsupported", "This browser does not support WebRTC.");
      return;
    }

    const normalizedOfferToken = String(offerToken || "").trim();
    if (!normalizedOfferToken) {
      remoteStatus.value = "Paste a desktop offer token first.";
      return;
    }

    const source =
      options.source === "pair-link"
        ? "pair-link"
        : options.source === "retry"
          ? "retry"
          : options.source === "signaling"
            ? "signaling"
          : "manual";

    lastDesktopOfferToken = normalizedOfferToken;
    answerToken.value = "";
    closeClientConnection();
    attachClientPeerConnection(buildPeerConnection({ iceServers }));
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
      clearDiagnosticsError();
      syncClientDiagnostics();
      remoteStatus.value =
        source === "pair-link"
          ? "Answer ready from pairing link. Copy it back to desktop."
          : source === "retry"
            ? "Retry answer ready. Copy it back to desktop."
            : source === "signaling"
              ? "Answer generated. Sending to desktop through signaling..."
            : "Answer ready. Paste it back on desktop.";
    } catch {
      remoteStatus.value =
        source === "pair-link"
          ? "Pairing link is invalid or expired. Request a new one from desktop."
          : source === "signaling"
            ? "Signaling session is invalid or expired. Request a new pairing link."
          : "Invalid desktop offer token.";
      setDiagnosticsError(
        "invalid-offer-token",
        "Desktop offer token is invalid. Request a fresh offer token."
      );
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

  function retryClientReconnect() {
    if (!lastDesktopOfferToken) {
      remoteStatus.value = "Paste a desktop offer token first.";
      return;
    }

    remoteStatus.value = "Retrying connection with latest offer token...";
    void createAnswerToken(lastDesktopOfferToken, { source: "retry" });
  }

  function disconnectClientRemote() {
    closeClientConnection();
    remoteStatus.value = "Remote disconnected.";
  }

  onBeforeUnmount(() => {
    closeClientConnection();
  });

  onMounted(() => {
    if (initialSignalSessionId.value) {
      void createAnswerFromSignalingSession(initialSignalSessionId.value);
      return;
    }

    if (!initialOfferToken.value) {
      return;
    }

    remoteStatus.value = "Pairing link detected. Generating answer token...";
    void createAnswerToken(initialOfferToken.value, { source: "pair-link" });
  });

  return {
    remoteStatus,
    remoteDiagnostics,
    answerToken,
    initialOfferToken: computed(() => initialOfferToken.value),
    isRemoteConnected: computed(() => isRemoteConnected.value),
    createAnswerToken,
    copyAnswerToken,
    sendRemoteCommand,
    retryClientReconnect,
    disconnectClientRemote
  };
}
