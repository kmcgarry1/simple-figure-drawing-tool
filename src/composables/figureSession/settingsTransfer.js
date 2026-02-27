import { normalizeSessionPreferences } from "./persistence";

const EXPORT_SCHEMA_VERSION = 1;
const SETTINGS_SHARE_QUERY_PARAM = "share";

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

export function createSettingsExportPayload(preferences) {
  return {
    app: "figure-drawing",
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    preferences: normalizeSessionPreferences(preferences)
  };
}

export function parseSettingsImportText(rawText) {
  const parsed = JSON.parse(String(rawText || ""));
  const sourcePreferences =
    parsed && typeof parsed === "object" && parsed.preferences ? parsed.preferences : parsed;

  return normalizeSessionPreferences(sourcePreferences);
}

export function createSettingsShareToken(preferences) {
  const payload = createSettingsExportPayload(preferences);
  return encodeBase64UrlFromJson(JSON.stringify(payload));
}

export function parseSettingsShareToken(shareToken) {
  const rawJsonText = decodeBase64UrlToJson(shareToken);
  return parseSettingsImportText(rawJsonText);
}

export function readSettingsShareTokenFromSearch(search) {
  try {
    const params = new URLSearchParams(String(search || ""));
    return String(params.get(SETTINGS_SHARE_QUERY_PARAM) || "").trim();
  } catch {
    return "";
  }
}

export function buildSettingsShareUrl({ currentUrl, shareToken }) {
  const normalizedShareToken = String(shareToken || "").trim();
  if (!normalizedShareToken) {
    return "";
  }

  try {
    const url = new URL(String(currentUrl || ""));
    url.searchParams.set(SETTINGS_SHARE_QUERY_PARAM, normalizedShareToken);
    return url.toString();
  } catch {
    return "";
  }
}
