import { describe, expect, it } from "vitest";
import { buildSessionInsights } from "./sessionInsights";

describe("buildSessionInsights", () => {
  it("aggregates weekly totals and usage rankings", () => {
    const nowMs = Date.parse("2026-02-27T12:00:00.000Z");
    const history = [
      {
        endedAt: "2026-02-26T10:00:00.000Z",
        result: "completed",
        elapsedSeconds: 1200,
        plannedSlides: 20,
        completedSlides: 20,
        templateName: "Gesture Warmups",
        appliedTags: ["hands", "torso"]
      },
      {
        endedAt: "2026-02-23T10:00:00.000Z",
        result: "ended",
        elapsedSeconds: 600,
        plannedSlides: 10,
        completedSlides: 4,
        templateName: "Gesture Warmups",
        appliedTags: ["hands"]
      },
      {
        endedAt: "2026-02-10T10:00:00.000Z",
        result: "completed",
        elapsedSeconds: 900,
        plannedSlides: 8,
        completedSlides: 8,
        templateName: "Long Pose Set",
        appliedTags: ["long-pose"]
      }
    ];

    const insights = buildSessionInsights(history, { nowMs, windowDays: 7 });

    expect(insights).toMatchObject({
      windowDays: 7,
      sessionsInWindow: 2,
      completedSessionsInWindow: 1,
      totalElapsedSecondsInWindow: 1800,
      totalCompletedSlidesInWindow: 24,
      averageCompletionRatioPercent: 80
    });
    expect(insights.averageCompletedSlides).toBe(12);
    expect(insights.topTemplates[0]).toEqual({
      label: "Gesture Warmups",
      count: 2
    });
    expect(insights.topTags[0]).toEqual({
      label: "hands",
      count: 2
    });
  });

  it("returns safe defaults for empty history", () => {
    const insights = buildSessionInsights([], {
      nowMs: Date.parse("2026-02-27T12:00:00.000Z")
    });

    expect(insights.sessionsInWindow).toBe(0);
    expect(insights.averageCompletedSlides).toBe(0);
    expect(insights.averageCompletionRatioPercent).toBe(0);
    expect(insights.topTemplates).toEqual([]);
    expect(insights.topTags).toEqual([]);
  });
});
