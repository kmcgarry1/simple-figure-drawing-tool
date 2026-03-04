import { normalizeSessionPreferences } from "./persistence";

const EXPORT_SCHEMA_VERSION = 1;
const SETTINGS_SHARE_QUERY_PARAM = "share";
const SETTINGS_SHARE_REFERENCE_QUERY_PARAM = "shareRef";
const DEFAULT_SETTINGS_SHARE_STORAGE_TIMEOUT_MS = 5000;

export const DEFAULT_SETTINGS_SHARE_EXPIRY_SECONDS = 24 * 60 * 60;
export const SETTINGS_SHARE_EXPIRY_OPTIONS = Object.freeze([
  {
    label: "1 hour",
    valueSeconds: 60 * 60
  },
  {
    label: "6 hours",
    valueSeconds: 6 * 60 * 60
  },
  {
    label: "24 hours",
    valueSeconds: DEFAULT_SETTINGS_SHARE_EXPIRY_SECONDS
  },
  {
    label: "7 days",
    valueSeconds: 7 * 24 * 60 * 60
  },
  {
    label: "30 days",
    valueSeconds: 30 * 24 * 60 * 60
  }
]);

function isFiniteTimestamp(rawValue) {
  return Number.isFinite(rawValue) && rawValue > 0;
}

function parsePositiveInteger(rawValue, fallbackValue) {
  const parsedValue = Number.parseInt(String(rawValue), 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallbackValue;
  }

  return parsedValue;
}

function readSettingsTransferEnv(overrides) {
  if (overrides && typeof overrides === "object") {
    return overrides;
  }

  return import.meta.env || {};
}

function parseIsoTimestamp(rawTimestamp) {
  const normalizedTimestamp = String(rawTimestamp || "").trim();
  if (!normalizedTimestamp) {
    return null;
  }

  const parsedTimestamp = Date.parse(normalizedTimestamp);
  return Number.isNaN(parsedTimestamp) ? null : parsedTimestamp;
}

function resolveSettingsShareExpiresAt({ expiresInSeconds, nowMs = Date.now() }) {
  const normalizedExpirySeconds = normalizeSettingsShareExpirySeconds(expiresInSeconds);
  const nowTimestamp = isFiniteTimestamp(nowMs) ? nowMs : Date.now();
  const expirationTimestampMs = nowTimestamp + normalizedExpirySeconds * 1000;
  return new Date(expirationTimestampMs).toISOString();
}

function encodeBase64UrlFromJson(json) {
  if (typeof TextEncoder !== "undefined") {
    const bytes = new TextEncoder().encode(json);
    if (typeof window !== "undefined" && typeof window.btoa === "function") {
      let binary = "";
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      return window
        .btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
    }

    if (typeof globalThis !== "undefined" && typeof globalThis.Buffer !== "undefined") {
      return globalThis.Buffer.from(bytes)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
    }
  }

  throw new Error("Unable to encode share token.");
}

function decodeBase64UrlToJson(token) {
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) {
    throw new Error("Missing share token.");
  }

  const paddedToken = normalizedToken
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(normalizedToken.length / 4) * 4, "=");

  if (typeof window !== "undefined" && typeof window.atob === "function") {
    const binary = window.atob(paddedToken);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  if (typeof globalThis !== "undefined" && typeof globalThis.Buffer !== "undefined") {
    return globalThis.Buffer.from(paddedToken, "base64").toString("utf-8");
  }

  throw new Error("Unable to decode share token.");
}

export function normalizeSettingsShareExpirySeconds(
  rawExpirySeconds,
  fallbackExpirySeconds = DEFAULT_SETTINGS_SHARE_EXPIRY_SECONDS
) {
  return parsePositiveInteger(rawExpirySeconds, fallbackExpirySeconds);
}

export function buildSettingsShareStorageConfig(options = {}) {
  const env = readSettingsTransferEnv(options.env);
  const endpoint = String(
    options.endpoint ?? env.VITE_SETTINGS_SHARE_ENDPOINT ?? env.SETTINGS_SHARE_ENDPOINT ?? ""
  ).trim();

  return {
    enabled: Boolean(endpoint),
    endpoint,
    requestTimeoutMs: parsePositiveInteger(
      options.requestTimeoutMs ??
        env.VITE_SETTINGS_SHARE_TIMEOUT_MS ??
        env.SETTINGS_SHARE_TIMEOUT_MS,
      DEFAULT_SETTINGS_SHARE_STORAGE_TIMEOUT_MS
    )
  };
}

export function createSettingsExportPayload(preferences, options = {}) {
  const includeExpiry = options.includeExpiry === true;
  const nowMs = isFiniteTimestamp(options.nowMs) ? options.nowMs : Date.now();

  return {
    app: "figure-drawing",
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date(nowMs).toISOString(),
    expiresAt: includeExpiry
      ? resolveSettingsShareExpiresAt({
          nowMs,
          expiresInSeconds: options.expiresInSeconds
        })
      : null,
    preferences: normalizeSessionPreferences(preferences)
  };
}

export function parseSettingsImportText(rawText, options = {}) {
  const parsed = JSON.parse(String(rawText || ""));
  const enforceExpiry = options.enforceExpiry === true;
  const nowMs = isFiniteTimestamp(options.nowMs) ? options.nowMs : Date.now();
  const parsedExpiryTimestampMs = parseIsoTimestamp(parsed?.expiresAt);

  if (enforceExpiry && parsed?.expiresAt != null && parsedExpiryTimestampMs === null) {
    const invalidExpiryError = new Error("Share link expiry is invalid.");
    invalidExpiryError.code = "share-expiry-invalid";
    throw invalidExpiryError;
  }

  if (enforceExpiry && parsedExpiryTimestampMs !== null && nowMs > parsedExpiryTimestampMs) {
    const expiredShareError = new Error("Share link has expired.");
    expiredShareError.code = "share-expired";
    throw expiredShareError;
  }

  const sourcePreferences =
    parsed && typeof parsed === "object" && parsed.preferences ? parsed.preferences : parsed;

  return normalizeSessionPreferences(sourcePreferences);
}

export function createSettingsShareToken(preferences, options = {}) {
  const payload = createSettingsExportPayload(preferences, {
    ...options,
    includeExpiry: true
  });
  return encodeBase64UrlFromJson(JSON.stringify(payload));
}

export function parseSettingsShareToken(shareToken, options = {}) {
  const rawJsonText = decodeBase64UrlToJson(shareToken);
  return parseSettingsImportText(rawJsonText, {
    ...options,
    enforceExpiry: true
  });
}

export function readSettingsShareTokenFromSearch(search) {
  try {
    const params = new URLSearchParams(String(search || ""));
    return String(params.get(SETTINGS_SHARE_QUERY_PARAM) || "").trim();
  } catch {
    return "";
  }
}

export function readSettingsShareReferenceFromSearch(search) {
  try {
    const params = new URLSearchParams(String(search || ""));
    return String(params.get(SETTINGS_SHARE_REFERENCE_QUERY_PARAM) || "").trim();
  } catch {
    return "";
  }
}

export function buildSettingsShareUrl({ currentUrl, shareToken, shareReference }) {
  const normalizedShareReference = String(shareReference || "").trim();
  const normalizedShareToken = String(shareToken || "").trim();
  if (!normalizedShareReference && !normalizedShareToken) {
    return "";
  }

  try {
    const url = new URL(String(currentUrl || ""));
    if (normalizedShareReference) {
      url.searchParams.set(SETTINGS_SHARE_REFERENCE_QUERY_PARAM, normalizedShareReference);
      url.searchParams.delete(SETTINGS_SHARE_QUERY_PARAM);
      return url.toString();
    }

    url.searchParams.set(SETTINGS_SHARE_QUERY_PARAM, normalizedShareToken);
    url.searchParams.delete(SETTINGS_SHARE_REFERENCE_QUERY_PARAM);
    return url.toString();
  } catch {
    return "";
  }
}
