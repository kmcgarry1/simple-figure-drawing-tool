import {
  buildSettingsShareStorageConfig,
  buildSettingsShareUrl,
  createSettingsExportPayload,
  createSettingsShareToken,
  DEFAULT_SETTINGS_SHARE_EXPIRY_SECONDS,
  normalizeSettingsShareExpirySeconds,
  parseSettingsImportText,
  parseSettingsShareToken,
  readSettingsShareReferenceFromSearch,
  SETTINGS_SHARE_EXPIRY_OPTIONS,
  readSettingsShareTokenFromSearch
} from "./settingsTransfer";

export function createSettingsTransferActions({
  sessionMode,
  durationSeconds,
  classPresetId,
  classBlocks,
  classPhotoOrder,
  avoidImmediateRepeats,
  photoTagsById,
  audioMuted,
  audioVolumePercent,
  hasSourcePhotos,
  isSessionLive,
  phase,
  statusMessage,
  clearTimers,
  revokeSlideUrl,
  resetPlaybackState,
  sessionSlides,
  prepareActiveSet
}) {
  const shareStorageConfig = buildSettingsShareStorageConfig();

  async function writeClipboardText(rawText) {
    if (typeof navigator === "undefined" || typeof navigator.clipboard?.writeText !== "function") {
      return false;
    }

    try {
      await navigator.clipboard.writeText(String(rawText || ""));
      return true;
    } catch {
      return false;
    }
  }

  function resolveShareExpirySeconds(rawOptions) {
    const rawExpirySeconds =
      rawOptions && typeof rawOptions === "object"
        ? rawOptions.expiresInSeconds
        : rawOptions;
    return normalizeSettingsShareExpirySeconds(
      rawExpirySeconds,
      DEFAULT_SETTINGS_SHARE_EXPIRY_SECONDS
    );
  }

  function formatShareExpiryLabel(expiresInSeconds) {
    const matchingOption = SETTINGS_SHARE_EXPIRY_OPTIONS.find(
      (option) => option.valueSeconds === expiresInSeconds
    );
    if (matchingOption) {
      return matchingOption.label;
    }

    const hours = Math.round(expiresInSeconds / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  function buildShareStorageRequestUrl(pathname) {
    const normalizedEndpoint = String(shareStorageConfig.endpoint || "").trim();
    if (!normalizedEndpoint) {
      return "";
    }

    try {
      const endpointBaseUrl = new URL(
        normalizedEndpoint.endsWith("/") ? normalizedEndpoint : `${normalizedEndpoint}/`
      );
      return new URL(pathname, endpointBaseUrl).toString();
    } catch {
      return "";
    }
  }

  async function requestShareStorageJson(url, options = {}) {
    if (typeof fetch !== "function") {
      throw new Error("share-storage-fetch-unavailable");
    }

    const timeoutMs = Number.parseInt(String(shareStorageConfig.requestTimeoutMs), 10) || 5000;
    const abortController =
      typeof AbortController === "function" ? new AbortController() : null;
    const timeoutId =
      abortController !== null
        ? setTimeout(() => {
            abortController.abort();
          }, timeoutMs)
        : null;

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortController?.signal,
        headers: {
          Accept: "application/json",
          ...(options.headers || {})
        }
      });

      if (!response.ok) {
        const requestError = new Error(`share-storage-request-failed-${response.status}`);
        requestError.status = response.status;
        throw requestError;
      }

      return await response.json();
    } finally {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    }
  }

  async function createPersistedShareReference(payload, expiresInSeconds) {
    const url = buildShareStorageRequestUrl("shares");
    if (!url) {
      throw new Error("share-storage-endpoint-invalid");
    }

    const responsePayload = await requestShareStorageJson(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        payload,
        expiresInSeconds
      })
    });

    const reference = String(
      responsePayload?.shareReference ?? responsePayload?.shareId ?? responsePayload?.id ?? ""
    ).trim();
    if (!reference) {
      throw new Error("share-storage-reference-missing");
    }

    return reference;
  }

  async function readPersistedSharePayload(shareReference) {
    const url = buildShareStorageRequestUrl(`shares/${encodeURIComponent(shareReference)}`);
    if (!url) {
      throw new Error("share-storage-endpoint-invalid");
    }

    const responsePayload = await requestShareStorageJson(url, {
      method: "GET"
    });
    return responsePayload?.payload ?? responsePayload;
  }

  function getCurrentPreferences() {
    return {
      sessionMode: sessionMode.value,
      durationSeconds: durationSeconds.value,
      classPresetId: classPresetId.value,
      classBlocks: classBlocks.value,
      classPhotoOrder: classPhotoOrder.value,
      avoidImmediateRepeats: avoidImmediateRepeats.value,
      photoTagsById: photoTagsById.value,
      audioMuted: audioMuted.value,
      audioVolumePercent: audioVolumePercent.value
    };
  }

  function applyImportedPreferences(importedPreferences, successMessage) {
    sessionMode.value = importedPreferences.sessionMode;
    durationSeconds.value = importedPreferences.durationSeconds;
    classPresetId.value = importedPreferences.classPresetId;
    classBlocks.value = importedPreferences.classBlocks;
    classPhotoOrder.value = importedPreferences.classPhotoOrder;
    avoidImmediateRepeats.value = importedPreferences.avoidImmediateRepeats;
    photoTagsById.value = importedPreferences.photoTagsById;
    audioMuted.value = importedPreferences.audioMuted;
    audioVolumePercent.value = importedPreferences.audioVolumePercent;

    resetPreparedSession();

    if (hasSourcePhotos.value) {
      prepareActiveSet();
    } else {
      phase.value = "idle";
    }

    statusMessage.value = successMessage;
  }

  function resetPreparedSession() {
    clearTimers();
    revokeSlideUrl();
    resetPlaybackState();
    sessionSlides.value = [];
  }

  function exportSettingsJson() {
    if (typeof window === "undefined") {
      statusMessage.value = "Settings export is only available in the browser.";
      return;
    }

    const payload = createSettingsExportPayload(getCurrentPreferences());
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const blobUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadLink.href = blobUrl;
    downloadLink.download = `figure-drawing-settings-${dateStamp}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(blobUrl);
    statusMessage.value = "Settings exported to JSON.";
  }

  async function importSettingsFromFile(file) {
    if (!(file instanceof File)) {
      statusMessage.value = "Choose a JSON file to import.";
      return;
    }

    if (isSessionLive.value) {
      statusMessage.value = "End the current run before importing settings.";
      return;
    }

    try {
      const importedText = await file.text();
      const importedPreferences = parseSettingsImportText(importedText);
      applyImportedPreferences(importedPreferences, "Settings imported from JSON.");
    } catch {
      statusMessage.value = "Unable to import settings file.";
    }
  }

  async function copySettingsShareLink(options = {}) {
    if (typeof window === "undefined") {
      statusMessage.value = "Share links are only available in the browser.";
      return;
    }

    const expiresInSeconds = resolveShareExpirySeconds(options);
    const expiryLabel = formatShareExpiryLabel(expiresInSeconds);

    try {
      if (shareStorageConfig.enabled) {
        try {
          const sharePayload = createSettingsExportPayload(getCurrentPreferences(), {
            includeExpiry: true,
            expiresInSeconds
          });
          const shareReference = await createPersistedShareReference(
            sharePayload,
            expiresInSeconds
          );
          const persistedShareUrl = buildSettingsShareUrl({
            currentUrl: window.location.href,
            shareReference
          });

          if (persistedShareUrl) {
            const copiedPersisted = await writeClipboardText(persistedShareUrl);
            statusMessage.value = copiedPersisted
              ? `Persisted share link copied (expires in ${expiryLabel}).`
              : "Clipboard unavailable. Copy the generated share link manually.";
            return;
          }
        } catch {
          // Fall back to local token link if remote share storage is unavailable.
        }
      }

      const shareToken = createSettingsShareToken(getCurrentPreferences(), {
        expiresInSeconds
      });
      const shareUrl = buildSettingsShareUrl({
        currentUrl: window.location.href,
        shareToken
      });
      if (!shareUrl) {
        statusMessage.value = "Unable to generate a share link.";
        return;
      }

      const copied = await writeClipboardText(shareUrl);
      statusMessage.value = copied
        ? `Share link copied (expires in ${expiryLabel}).`
        : "Clipboard unavailable. Use Export JSON instead.";
    } catch {
      statusMessage.value = "Unable to generate a share link.";
    }
  }

  function clearShareParamsFromCurrentUrl() {
    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    const hasShareToken = url.searchParams.has("share");
    const hasShareReference = url.searchParams.has("shareRef");
    if (!hasShareToken && !hasShareReference) {
      return;
    }

    url.searchParams.delete("share");
    url.searchParams.delete("shareRef");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  }

  async function applySettingsFromShareUrl() {
    if (typeof window === "undefined") {
      return false;
    }

    const shareReference = readSettingsShareReferenceFromSearch(window.location.search);
    const shareToken = readSettingsShareTokenFromSearch(window.location.search);
    if (!shareToken && !shareReference) {
      return false;
    }

    if (isSessionLive.value) {
      statusMessage.value = "End the current run before importing a shared configuration link.";
      return false;
    }

    if (shareReference) {
      if (!shareStorageConfig.enabled) {
        statusMessage.value =
          "Shared link requires configured storage endpoint. Configure settings share storage or request a token link.";
        clearShareParamsFromCurrentUrl();
        return false;
      }

      try {
        const persistedPayload = await readPersistedSharePayload(shareReference);
        const importedPreferences = parseSettingsImportText(
          JSON.stringify(persistedPayload),
          { enforceExpiry: true }
        );
        applyImportedPreferences(importedPreferences, "Settings loaded from persisted shared link.");
        clearShareParamsFromCurrentUrl();
        return true;
      } catch (error) {
        if (error?.code === "share-expired" || error?.status === 410) {
          statusMessage.value = "Shared configuration link has expired.";
        } else if (error?.status === 404) {
          statusMessage.value = "Shared configuration link was not found or has expired.";
        } else {
          statusMessage.value = "Shared configuration link is invalid.";
        }
        clearShareParamsFromCurrentUrl();
        return false;
      }
    }

    try {
      const importedPreferences = parseSettingsShareToken(shareToken);
      applyImportedPreferences(importedPreferences, "Settings loaded from shared link.");
      clearShareParamsFromCurrentUrl();
      return true;
    } catch (error) {
      statusMessage.value =
        error?.code === "share-expired"
          ? "Shared configuration link has expired."
          : "Shared configuration link is invalid.";
      clearShareParamsFromCurrentUrl();
      return false;
    }
  }

  return {
    exportSettingsJson,
    importSettingsFromFile,
    copySettingsShareLink,
    applySettingsFromShareUrl
  };
}
