import { normalizeClassTemplates } from "./classTemplates";

const SYNC_KEY_STORAGE_KEY = "figureDrawing.classTemplateSyncKey.v1";
const DEFAULT_SYNC_TIMEOUT_MS = 5000;

function parsePositiveInteger(rawValue, fallbackValue) {
  const parsedValue = Number.parseInt(String(rawValue), 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallbackValue;
  }

  return parsedValue;
}

function readClassTemplateSyncEnv(overrides) {
  if (overrides && typeof overrides === "object") {
    return overrides;
  }

  const browserOverrides =
    typeof window !== "undefined" && typeof window === "object"
      ? {
          VITE_CLASS_TEMPLATE_SYNC_ENDPOINT: window.__FD_CLASS_TEMPLATE_SYNC_ENDPOINT__,
          VITE_CLASS_TEMPLATE_SYNC_TIMEOUT_MS: window.__FD_CLASS_TEMPLATE_SYNC_TIMEOUT_MS__
        }
      : {};

  return {
    ...(import.meta.env || {}),
    ...browserOverrides
  };
}

function normalizeSyncEndpoint(rawEndpoint) {
  return String(rawEndpoint || "").trim();
}

function readLocalDevSyncEndpointFallback() {
  if (typeof window === "undefined") {
    return "";
  }

  const { hostname, origin } = window.location || {};
  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    return "";
  }

  return `${origin}/__e2e-class-template-sync`;
}

export function normalizeClassTemplateSyncKey(rawKey) {
  return String(rawKey || "").trim();
}

export function buildClassTemplateSyncConfig(options = {}) {
  const env = readClassTemplateSyncEnv(options.env);
  const endpoint = normalizeSyncEndpoint(
    options.endpoint ??
      env.VITE_CLASS_TEMPLATE_SYNC_ENDPOINT ??
      env.VITE_CLASS_TEMPLATES_SYNC_ENDPOINT ??
      env.CLASS_TEMPLATE_SYNC_ENDPOINT ??
      env.CLASS_TEMPLATES_SYNC_ENDPOINT ??
      readLocalDevSyncEndpointFallback()
  );

  return {
    enabled: Boolean(endpoint),
    endpoint,
    requestTimeoutMs: parsePositiveInteger(
      options.requestTimeoutMs ??
        env.VITE_CLASS_TEMPLATE_SYNC_TIMEOUT_MS ??
        env.VITE_CLASS_TEMPLATES_SYNC_TIMEOUT_MS ??
        env.CLASS_TEMPLATE_SYNC_TIMEOUT_MS ??
        env.CLASS_TEMPLATES_SYNC_TIMEOUT_MS,
      DEFAULT_SYNC_TIMEOUT_MS
    )
  };
}

function resolveStorage(overrideStorage) {
  if (overrideStorage && typeof overrideStorage === "object") {
    return overrideStorage;
  }

  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    return window.localStorage;
  }

  return null;
}

export function loadClassTemplateSyncKey(options = {}) {
  const storage = resolveStorage(options.storage);
  if (!storage) {
    return "";
  }

  try {
    return normalizeClassTemplateSyncKey(storage.getItem(SYNC_KEY_STORAGE_KEY));
  } catch {
    return "";
  }
}

export function persistClassTemplateSyncKey(syncKey, options = {}) {
  const storage = resolveStorage(options.storage);
  if (!storage) {
    return;
  }

  const normalizedSyncKey = normalizeClassTemplateSyncKey(syncKey);
  try {
    if (!normalizedSyncKey) {
      storage.removeItem(SYNC_KEY_STORAGE_KEY);
      return;
    }

    storage.setItem(SYNC_KEY_STORAGE_KEY, normalizedSyncKey);
  } catch {
    // Ignore storage write failures to keep local class template actions uninterrupted.
  }
}

function buildSyncRequestUrl(endpoint, syncKey) {
  const normalizedEndpoint = normalizeSyncEndpoint(endpoint);
  const normalizedSyncKey = normalizeClassTemplateSyncKey(syncKey);
  if (!normalizedEndpoint || !normalizedSyncKey) {
    return "";
  }

  try {
    const baseUrl = new URL(
      normalizedEndpoint.endsWith("/") ? normalizedEndpoint : `${normalizedEndpoint}/`
    );
    return new URL(`templates/${encodeURIComponent(normalizedSyncKey)}`, baseUrl).toString();
  } catch {
    return "";
  }
}

function getFetchImpl(overrideFetch) {
  if (typeof overrideFetch === "function") {
    return overrideFetch;
  }

  if (typeof fetch === "function") {
    return fetch;
  }

  return null;
}

async function requestSyncJson(url, options = {}) {
  const fetchImpl = getFetchImpl(options.fetchImpl);
  if (!fetchImpl) {
    throw new Error("class-template-sync-fetch-unavailable");
  }

  const timeoutMs = parsePositiveInteger(options.timeoutMs, DEFAULT_SYNC_TIMEOUT_MS);
  const abortController =
    typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId =
    abortController !== null
      ? setTimeout(() => {
          abortController.abort();
        }, timeoutMs)
      : null;

  try {
    const response = await fetchImpl(url, {
      ...options,
      signal: abortController?.signal,
      headers: {
        Accept: "application/json",
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const requestError = new Error(`class-template-sync-request-failed-${response.status}`);
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

function resolveTemplatesFromSyncResponse(responsePayload) {
  if (Array.isArray(responsePayload)) {
    return responsePayload;
  }

  if (Array.isArray(responsePayload?.templates)) {
    return responsePayload.templates;
  }

  if (Array.isArray(responsePayload?.payload?.templates)) {
    return responsePayload.payload.templates;
  }

  return [];
}

export async function pullClassTemplatesFromRemote(options = {}) {
  const requestUrl = buildSyncRequestUrl(options.endpoint, options.syncKey);
  if (!requestUrl) {
    throw new Error("class-template-sync-missing-config");
  }

  const responsePayload = await requestSyncJson(requestUrl, {
    method: "GET",
    timeoutMs: options.requestTimeoutMs,
    fetchImpl: options.fetchImpl
  });
  return {
    templates: normalizeClassTemplates(resolveTemplatesFromSyncResponse(responsePayload))
  };
}

export async function pushClassTemplatesToRemote(options = {}) {
  const requestUrl = buildSyncRequestUrl(options.endpoint, options.syncKey);
  if (!requestUrl) {
    throw new Error("class-template-sync-missing-config");
  }

  const normalizedTemplates = normalizeClassTemplates(options.templates);
  await requestSyncJson(requestUrl, {
    method: "PUT",
    timeoutMs: options.requestTimeoutMs,
    fetchImpl: options.fetchImpl,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      templates: normalizedTemplates,
      syncedAt: new Date().toISOString()
    })
  });

  return {
    templateCount: normalizedTemplates.length
  };
}
