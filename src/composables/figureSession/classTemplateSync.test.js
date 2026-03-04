import { describe, expect, it } from "vitest";
import {
  buildClassTemplateSyncConfig,
  loadClassTemplateSyncKey,
  normalizeClassTemplateSyncKey,
  persistClassTemplateSyncKey,
  pullClassTemplatesFromRemote,
  pushClassTemplatesToRemote
} from "./classTemplateSync";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

describe("classTemplateSync config", () => {
  it("builds disabled config when endpoint is not configured", () => {
    const config = buildClassTemplateSyncConfig({
      env: {}
    });

    expect(config).toEqual({
      enabled: false,
      endpoint: "",
      requestTimeoutMs: 5000
    });
  });

  it("builds enabled config from endpoint env vars", () => {
    const config = buildClassTemplateSyncConfig({
      env: {
        VITE_CLASS_TEMPLATE_SYNC_ENDPOINT: "https://sync.example.com/api",
        VITE_CLASS_TEMPLATE_SYNC_TIMEOUT_MS: "7000"
      }
    });

    expect(config).toEqual({
      enabled: true,
      endpoint: "https://sync.example.com/api",
      requestTimeoutMs: 7000
    });
  });
});

describe("classTemplateSync key persistence", () => {
  it("normalizes and persists sync keys in provided storage", () => {
    const storage = createMemoryStorage();

    persistClassTemplateSyncKey("  studio-key  ", {
      storage
    });
    expect(loadClassTemplateSyncKey({ storage })).toBe("studio-key");
    expect(normalizeClassTemplateSyncKey("  studio-key  ")).toBe("studio-key");
  });

  it("clears persisted sync key when value is empty", () => {
    const storage = createMemoryStorage();

    persistClassTemplateSyncKey("studio-key", {
      storage
    });
    persistClassTemplateSyncKey("   ", {
      storage
    });

    expect(loadClassTemplateSyncKey({ storage })).toBe("");
  });
});

describe("classTemplateSync remote requests", () => {
  it("pushes normalized templates to the configured sync endpoint", async () => {
    const requests = [];
    const fetchImpl = async (url, options) => {
      requests.push({ url, options });
      return {
        ok: true,
        json: async () => ({ status: "ok" })
      };
    };

    const result = await pushClassTemplatesToRemote({
      endpoint: "https://sync.example.com/api",
      syncKey: "studio-team",
      templates: [
        {
          name: "Gesture Warmups",
          blocks: [{ label: "Warm-up", durationSeconds: 60, poseCount: 5 }]
        }
      ],
      fetchImpl
    });

    expect(result.templateCount).toBe(1);
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe("https://sync.example.com/api/templates/studio-team");
    expect(requests[0].options.method).toBe("PUT");

    const payload = JSON.parse(requests[0].options.body);
    expect(Array.isArray(payload.templates)).toBe(true);
    expect(payload.templates[0].name).toBe("Gesture Warmups");
  });

  it("pulls normalized templates from the configured sync endpoint", async () => {
    const fetchImpl = async () => ({
      ok: true,
      json: async () => ({
        templates: [
          {
            name: "Long Pose Set",
            blocks: [{ label: "Long Pose", durationSeconds: 600, poseCount: 2 }]
          }
        ]
      })
    });

    const result = await pullClassTemplatesFromRemote({
      endpoint: "https://sync.example.com",
      syncKey: "studio-team",
      fetchImpl
    });

    expect(result.templates).toHaveLength(1);
    expect(result.templates[0].name).toBe("Long Pose Set");
  });

  it("throws when sync config is missing", async () => {
    await expect(
      pullClassTemplatesFromRemote({
        endpoint: "",
        syncKey: ""
      })
    ).rejects.toThrowError("class-template-sync-missing-config");
  });
});
