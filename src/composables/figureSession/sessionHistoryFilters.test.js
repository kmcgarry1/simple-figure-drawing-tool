import { describe, expect, it } from "vitest";
import {
  createSessionHistoryExportPayload,
  filterSessionHistory,
  normalizeSessionHistoryFilters
} from "./sessionHistoryFilters";

const FIXED_HISTORY_ENTRIES = [
  {
    id: "entry-1",
    sessionMode: "quick",
    result: "completed",
    endedAt: "2026-03-01T10:00:00.000Z"
  },
  {
    id: "entry-2",
    sessionMode: "class",
    result: "ended",
    endedAt: "2026-02-20T10:00:00.000Z"
  },
  {
    id: "entry-3",
    sessionMode: "quick",
    result: "ended",
    endedAt: "invalid-time"
  }
];

describe("normalizeSessionHistoryFilters", () => {
  it("normalizes unsupported mode/outcome values to 'all'", () => {
    expect(
      normalizeSessionHistoryFilters({
        mode: "unknown",
        outcome: "nope",
        dateFrom: " 2026-02-01 ",
        dateTo: "2026-03-01"
      })
    ).toEqual({
      mode: "all",
      outcome: "all",
      dateFrom: "2026-02-01",
      dateTo: "2026-03-01"
    });
  });
});

describe("filterSessionHistory", () => {
  it("filters by mode and outcome", () => {
    const result = filterSessionHistory(FIXED_HISTORY_ENTRIES, {
      mode: "quick",
      outcome: "completed"
    });

    expect(result.map((entry) => entry.id)).toEqual(["entry-1"]);
  });

  it("filters by date range and excludes invalid timestamps when date filters are active", () => {
    const result = filterSessionHistory(FIXED_HISTORY_ENTRIES, {
      dateFrom: "2026-02-25",
      dateTo: "2026-03-02"
    });

    expect(result.map((entry) => entry.id)).toEqual(["entry-1"]);
  });
});

describe("createSessionHistoryExportPayload", () => {
  it("includes normalized filters and exported entries", () => {
    const payload = createSessionHistoryExportPayload(FIXED_HISTORY_ENTRIES, {
      mode: "class",
      outcome: "ended",
      dateFrom: "",
      dateTo: ""
    });

    expect(payload.app).toBe("figure-drawing");
    expect(payload.schemaVersion).toBe(1);
    expect(payload.entryCount).toBe(3);
    expect(payload.filters).toEqual({
      mode: "class",
      outcome: "ended",
      dateFrom: "",
      dateTo: ""
    });
    expect(payload.entries).toHaveLength(3);
  });
});
