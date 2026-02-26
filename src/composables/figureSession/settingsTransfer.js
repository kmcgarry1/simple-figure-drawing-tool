import { normalizeSessionPreferences } from "./persistence";

const EXPORT_SCHEMA_VERSION = 1;

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
