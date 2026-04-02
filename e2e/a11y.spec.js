import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X4NwAAAAASUVORK5CYII=",
  "base64"
);

function createPngFilePayload(name) {
  return {
    name,
    mimeType: "image/png",
    buffer: ONE_PIXEL_PNG
  };
}

async function expectNoCriticalOrSeriousViolations(page, { include }) {
  const builder = new AxeBuilder({ page });
  if (include) {
    builder.include(include);
  }

  const analysis = await builder.disableRules(["color-contrast"]).analyze();
  const seriousViolations = analysis.violations.filter((violation) =>
    ["critical", "serious"].includes(String(violation.impact))
  );

  expect(seriousViolations).toEqual([]);
}

test("studio route has no critical or serious accessibility violations", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.locator("main")).toBeVisible();
  await page.getByText("More").click();
  await expectNoCriticalOrSeriousViolations(page, { include: "body" });
});

test("manage library drawer has no critical or serious accessibility violations", async ({ page }) => {
  await page.goto("/studio");
  await page.locator("#studioPhotoInput").setInputFiles([
    createPngFilePayload("a11y-1.png"),
    createPngFilePayload("a11y-2.png")
  ]);

  await page.getByRole("button", { name: "Manage Library" }).click();
  await expect(page.getByRole("dialog", { name: "Manage library" })).toBeVisible();
  await expectNoCriticalOrSeriousViolations(page, { include: '[role="dialog"][aria-modal="true"]' });
});

test("history tabs and archive tools have no critical or serious accessibility violations", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "figureDrawing.history.v1",
      JSON.stringify([
        {
          id: "a11y-history-1",
          sessionMode: "quick",
          result: "completed",
          startedAt: "2026-03-01T10:00:00.000Z",
          endedAt: "2026-03-01T10:05:00.000Z",
          elapsedSeconds: 300,
          plannedSlides: 5,
          completedSlides: 5,
          plannedDurationSeconds: 300,
          completedDurationSeconds: 300,
          durationDeltaSeconds: 0,
          plannedBreakCount: 0,
          completedBreakCount: 0,
          plannedBreakDurationSeconds: 0,
          completedBreakDurationSeconds: 0,
          templateName: "",
          presetId: "quick-session",
          presetLabel: "Quick Session",
          appliedTags: []
        }
      ])
    );
    window.localStorage.setItem(
      "figureDrawing.runSnapshots.v1",
      JSON.stringify([
        {
          id: "a11y-snapshot-1",
          name: "Quick Snapshot",
          sessionMode: "quick",
          sourceSessionId: "a11y-history-1",
          templateName: "",
          appliedTags: [],
          updatedAt: "2026-03-01T10:05:00.000Z",
          createdAt: "2026-03-01T10:05:00.000Z",
          rerunSettings: {
            sessionMode: "quick",
            durationSeconds: 60,
            classPresetId: "class-3h",
            classBlocks: [],
            classPhotoOrder: "shuffle",
            avoidImmediateRepeats: true
          }
        }
      ])
    );
  });

  await page.goto("/history");
  await page.getByRole("button", { name: "Snapshots" }).click();
  await page.getByText("Filters, export, and maintenance").click();
  await expectNoCriticalOrSeriousViolations(page, { include: "body" });
});

test("live session settings sheet has no critical or serious accessibility violations", async ({ page }) => {
  await page.goto("/studio");
  await page.locator("#studioPhotoInput").setInputFiles([
    createPngFilePayload("a11y-live-1.png"),
    createPngFilePayload("a11y-live-2.png")
  ]);

  await page.getByRole("button", { name: "Start Session" }).click();
  await page.getByRole("button", { name: "Session Settings" }).click();
  await expect(page.getByRole("dialog", { name: "Session settings" })).toBeVisible();
  await expectNoCriticalOrSeriousViolations(page, { include: '[role="dialog"][aria-modal="true"]' });
});

test("remote route has no critical or serious accessibility violations", async ({ page }) => {
  await page.goto("/remote");
  await expect(page.locator("main")).toBeVisible();
  await expectNoCriticalOrSeriousViolations(page, { include: "body" });
});
