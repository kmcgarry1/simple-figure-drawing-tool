import { test, expect } from "@playwright/test";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X4NwAAAAASUVORK5CYII=",
  "base64"
);
const TEMPLATE_SYNC_ENDPOINT_PATH = "/__e2e-class-template-sync/templates/";

function createPngFilePayload(name) {
  return {
    name,
    mimeType: "image/png",
    buffer: ONE_PIXEL_PNG
  };
}

function parseClockToSeconds(clockText) {
  const normalized = String(clockText || "").trim();
  const secondsMatch = normalized.match(/^(\d+)s$/);
  if (secondsMatch) {
    return Number(secondsMatch[1]);
  }

  const parts = normalized.split(":").map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) {
    return null;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return null;
}

async function openSetupWizard(page) {
  const wizard = wizardDialog(page);
  const anyModalDialog = page.locator('[role="dialog"][aria-modal="true"]');
  if (
    (await wizard.isVisible({ timeout: 1500 }).catch(() => false)) ||
    (await anyModalDialog.isVisible({ timeout: 1500 }).catch(() => false))
  ) {
    return;
  }

  const trigger = page.getByRole("button", { name: /Setup Wizard/ });
  try {
    await trigger.click({ timeout: 1500 });
  } catch (error) {
    if (
      (await wizard.isVisible({ timeout: 1500 }).catch(() => false)) ||
      (await anyModalDialog.isVisible({ timeout: 1500 }).catch(() => false))
    ) {
      return;
    }
    throw error;
  }

  await expect(wizard).toBeVisible();
}

function wizardDialog(page) {
  return page.getByRole("dialog", { name: "Setup Wizard" });
}

function wizardStepButton(page, stepNumber, stepTitle) {
  return wizardDialog(page).getByRole("button", {
    name: new RegExp(`Step\\s*${stepNumber}[\\s\\S]*${stepTitle}`, "i")
  });
}

test("quick session flow can start, pause, and end", async ({ page }) => {
  await page.goto("/");

  await openSetupWizard(page);
  await wizardStepButton(page, 1, "Photos").click();
  await wizardDialog(page).locator("#photoInput").setInputFiles([
    createPngFilePayload("pose-1.png"),
    createPngFilePayload("pose-2.png"),
    createPngFilePayload("pose-3.png")
  ]);

  const wizard = wizardDialog(page);
  await wizard.getByRole("button", { name: "Quick Session" }).click();
  await wizard.getByRole("button", { name: "Start Session" }).click();

  await expect(page.getByRole("button", { name: "End" })).toBeVisible();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await page.getByRole("button", { name: "End" }).click();
  await expect(page.getByText("Session stopped.")).toBeVisible();
});

test("session preview appears before starting from setup wizard", async ({ page }) => {
  await page.goto("/");

  await openSetupWizard(page);
  await wizardStepButton(page, 1, "Photos").click();
  await wizardDialog(page).locator("#photoInput").setInputFiles([
    createPngFilePayload("pose-1.png"),
    createPngFilePayload("pose-2.png"),
    createPngFilePayload("pose-3.png")
  ]);

  const wizard = wizardDialog(page);
  await wizardStepButton(page, 2, "Session").click();
  await expect(wizard.getByText("Session Preview")).toBeVisible();
  await expect(wizard.getByText(/Showing (first|all)/)).toBeVisible();
  await expect(wizard.getByText(/Pose 1/)).toBeVisible();
});

test("advanced photo manager supports drag-and-drop reordering", async ({ page }) => {
  await page.goto("/");

  await openSetupWizard(page);
  await wizardStepButton(page, 1, "Photos").click();
  await wizardDialog(page).locator("#photoInput").setInputFiles([
    createPngFilePayload("drag-pose-1.png"),
    createPngFilePayload("drag-pose-2.png"),
    createPngFilePayload("drag-pose-3.png")
  ]);

  const wizard = wizardDialog(page);
  await wizardStepButton(page, 3, "Advanced").click();

  const photoCards = wizard.locator('[aria-label="Source photo order"] article');
  await expect(photoCards.nth(0)).toContainText("drag-pose-1.png");
  await expect(photoCards.nth(2)).toContainText("drag-pose-3.png");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const sourceThumbnail = photoCards.nth(2).locator("img").first();
    const targetThumbnail = photoCards.nth(0).locator("img").first();
    await sourceThumbnail.dragTo(targetThumbnail);

    if ((await photoCards.nth(0).textContent())?.includes("drag-pose-3.png")) {
      break;
    }

    await page.waitForTimeout(120);
  }

  await expect(photoCards.nth(0)).toContainText("drag-pose-3.png");
});

test("advanced photo manager keeps keyboard/button reorder fallback", async ({ page }) => {
  await page.goto("/");

  await openSetupWizard(page);
  await wizardStepButton(page, 1, "Photos").click();
  await wizardDialog(page).locator("#photoInput").setInputFiles([
    createPngFilePayload("keys-pose-1.png"),
    createPngFilePayload("keys-pose-2.png"),
    createPngFilePayload("keys-pose-3.png")
  ]);

  const wizard = wizardDialog(page);
  await wizardStepButton(page, 3, "Advanced").click();

  const photoCards = wizard.locator('[aria-label="Source photo order"] article');
  await expect(photoCards.nth(0)).toContainText("keys-pose-1.png");
  await expect(photoCards.nth(1)).toContainText("keys-pose-2.png");

  const moveUpButton = wizard.getByRole("button", {
    name: "Move keys-pose-2.png up"
  });
  await moveUpButton.focus();
  await page.keyboard.press("Enter");

  await expect(photoCards.nth(0)).toContainText("keys-pose-2.png");
});

test("advanced photo manager supports bulk tag apply and remove", async ({ page }) => {
  await page.goto("/");

  await openSetupWizard(page);
  await wizardStepButton(page, 1, "Photos").click();
  await wizardDialog(page).locator("#photoInput").setInputFiles([
    createPngFilePayload("bulk-pose-1.png"),
    createPngFilePayload("bulk-pose-2.png"),
    createPngFilePayload("bulk-pose-3.png")
  ]);

  const wizard = wizardDialog(page);
  await wizardStepButton(page, 3, "Advanced").click();

  await wizard.getByRole("checkbox", { name: "Select bulk-pose-1.png for bulk tag actions" }).check();
  await wizard.getByRole("checkbox", { name: "Select bulk-pose-2.png for bulk tag actions" }).check();
  await wizard.getByLabel("Tag Name").fill("gesture");
  await wizard.getByRole("button", { name: "Apply Tag" }).click();

  await expect(wizard.getByLabel("Tag for bulk-pose-1.png")).toHaveValue("gesture");
  await expect(wizard.getByLabel("Tag for bulk-pose-2.png")).toHaveValue("gesture");
  await expect(wizard.getByLabel("Tag for bulk-pose-3.png")).toHaveValue("");

  await wizard.getByRole("button", { name: "Remove Tag" }).click();
  await expect(wizard.getByLabel("Tag for bulk-pose-1.png")).toHaveValue("");
  await expect(wizard.getByLabel("Tag for bulk-pose-2.png")).toHaveValue("");
});

test("history filters and export work from advanced setup", async ({ page }) => {
  await page.goto("/");

  await page.evaluate(() => {
    const seededHistory = [
      {
        id: "seed-quick-completed",
        sessionMode: "quick",
        result: "completed",
        startedAt: "2026-02-27T10:00:00.000Z",
        endedAt: "2026-02-27T10:10:00.000Z",
        elapsedSeconds: 600,
        plannedSlides: 10,
        completedSlides: 10,
        plannedDurationSeconds: 600,
        completedDurationSeconds: 600,
        durationDeltaSeconds: 0,
        plannedBreakCount: 0,
        completedBreakCount: 0,
        plannedBreakDurationSeconds: 0,
        completedBreakDurationSeconds: 0,
        templateName: "",
        presetId: "quick-session",
        presetLabel: "Quick Session",
        appliedTags: []
      },
      {
        id: "seed-class-ended",
        sessionMode: "class",
        result: "ended",
        startedAt: "2026-02-28T10:00:00.000Z",
        endedAt: "2026-02-28T10:03:00.000Z",
        elapsedSeconds: 180,
        plannedSlides: 6,
        completedSlides: 2,
        plannedDurationSeconds: 600,
        completedDurationSeconds: 180,
        durationDeltaSeconds: -420,
        plannedBreakCount: 2,
        completedBreakCount: 1,
        plannedBreakDurationSeconds: 300,
        completedBreakDurationSeconds: 120,
        templateName: "Custom Class Plan",
        presetId: "class-2h",
        presetLabel: "2 Hour",
        appliedTags: ["hands"]
      },
      {
        id: "seed-quick-ended",
        sessionMode: "quick",
        result: "ended",
        startedAt: "2026-02-15T10:00:00.000Z",
        endedAt: "2026-02-15T10:02:00.000Z",
        elapsedSeconds: 120,
        plannedSlides: 8,
        completedSlides: 2,
        plannedDurationSeconds: 240,
        completedDurationSeconds: 120,
        durationDeltaSeconds: -120,
        plannedBreakCount: 0,
        completedBreakCount: 0,
        plannedBreakDurationSeconds: 0,
        completedBreakDurationSeconds: 0,
        templateName: "",
        presetId: "quick-session",
        presetLabel: "Quick Session",
        appliedTags: []
      }
    ];

    window.localStorage.setItem("figureDrawing.history.v1", JSON.stringify(seededHistory));
  });

  await page.reload();
  await openSetupWizard(page);
  await wizardStepButton(page, 1, "Photos").click();
  await wizardDialog(page).locator("#photoInput").setInputFiles([
    createPngFilePayload("history-seed-pose-1.png")
  ]);
  await wizardStepButton(page, 3, "Advanced").click();

  const wizard = wizardDialog(page);
  await wizard.getByRole("button", { name: /Session History/i }).click();

  await wizard.getByLabel("Mode Filter").selectOption("class");
  await expect(wizard.getByText("Class | ended")).toBeVisible();
  await expect(wizard.getByText("Timing: 3m 00s elapsed vs 10m 00s planned (7m 00s under planned)")).toBeVisible();
  await expect(wizard.getByText("Breaks: 1 / 2 completed (2m 00s / 5m 00s)")).toBeVisible();
  await expect(wizard.getByText("Attribution: Template Custom Class Plan | Preset 2 Hour")).toBeVisible();
  await expect(wizard.getByText("Quick | completed")).toHaveCount(0);

  await wizard.getByLabel("Mode Filter").selectOption("all");
  await wizard.getByLabel("Outcome Filter").selectOption("completed");
  await expect(wizard.getByText("Quick | completed")).toBeVisible();
  await expect(wizard.getByText("Class | ended")).toHaveCount(0);

  const historyDownloadPromise = page.waitForEvent("download");
  await wizard.getByRole("button", { name: "Export History JSON" }).click();
  const historyDownload = await historyDownloadPromise;
  expect(historyDownload.suggestedFilename()).toMatch(/^figure-drawing-history-\d{4}-\d{2}-\d{2}\.json$/);

  await wizard.getByLabel("Date From").fill("2026-03-01");
  await expect(wizard.getByText("No sessions match current filters.")).toBeVisible();
});

test("history rerun restores saved quick setup", async ({ page }) => {
  await page.goto("/");

  await page.evaluate(() => {
    const seededHistory = [
      {
        id: "seed-rerun-quick",
        sessionMode: "quick",
        result: "completed",
        startedAt: "2026-03-01T10:00:00.000Z",
        endedAt: "2026-03-01T10:05:00.000Z",
        elapsedSeconds: 300,
        plannedSlides: 5,
        completedSlides: 5,
        templateName: "",
        appliedTags: [],
        rerunSettings: {
          sessionMode: "quick",
          durationSeconds: 95,
          classPresetId: "class-3h",
          classBlocks: [
            {
              blockType: "pose",
              label: "Gesture Drill",
              durationSeconds: 45,
              poseCount: 8,
              photoTag: "all"
            }
          ],
          classPhotoOrder: "sequential",
          avoidImmediateRepeats: false
        }
      }
    ];

    window.localStorage.setItem("figureDrawing.history.v1", JSON.stringify(seededHistory));
  });

  await page.reload();
  await openSetupWizard(page);
  await wizardStepButton(page, 1, "Photos").click();
  await wizardDialog(page).locator("#photoInput").setInputFiles([
    createPngFilePayload("history-rerun-pose-1.png")
  ]);

  const wizard = wizardDialog(page);
  await wizardStepButton(page, 3, "Advanced").click();
  await wizard.getByRole("button", { name: /Session History/i }).click();

  const quickHistoryCard = wizard.locator("article").filter({ hasText: "Quick | completed" }).first();
  await quickHistoryCard.getByRole("button", { name: "Rerun Setup" }).click();

  await wizardStepButton(page, 2, "Session").click();
  const quickModeButton = wizard.getByRole("button", { name: "Quick Session" });
  await expect(quickModeButton).toHaveAttribute("aria-pressed", "true");
  await expect(wizard.getByLabel("Seconds Per Photo")).toHaveValue("95");
});

test("named run snapshots can save and restore setup", async ({ page }) => {
  await page.goto("/");

  await page.evaluate(() => {
    const seededHistory = [
      {
        id: "seed-snapshot-quick",
        sessionMode: "quick",
        result: "completed",
        startedAt: "2026-03-01T10:00:00.000Z",
        endedAt: "2026-03-01T10:05:00.000Z",
        elapsedSeconds: 300,
        plannedSlides: 5,
        completedSlides: 5,
        templateName: "",
        appliedTags: [],
        rerunSettings: {
          sessionMode: "quick",
          durationSeconds: 95,
          classPresetId: "class-3h",
          classBlocks: [
            {
              blockType: "pose",
              label: "Gesture Drill",
              durationSeconds: 45,
              poseCount: 8,
              photoTag: "all"
            }
          ],
          classPhotoOrder: "sequential",
          avoidImmediateRepeats: false
        }
      }
    ];

    window.localStorage.setItem("figureDrawing.history.v1", JSON.stringify(seededHistory));
    window.localStorage.removeItem("figureDrawing.runSnapshots.v1");
  });

  await page.reload();
  await openSetupWizard(page);
  await wizardStepButton(page, 1, "Photos").click();
  await wizardDialog(page).locator("#photoInput").setInputFiles([
    createPngFilePayload("snapshot-restore-pose-1.png")
  ]);

  const wizard = wizardDialog(page);
  await wizardStepButton(page, 3, "Advanced").click();
  await wizard.getByRole("button", { name: /Session History/i }).click();

  const quickHistoryCard = wizard.locator("article").filter({ hasText: "Quick | completed" }).first();
  await quickHistoryCard.getByLabel("Snapshot Name").fill("Quick 95 Snapshot");
  await quickHistoryCard.getByRole("button", { name: "Save Snapshot" }).click();

  await expect(wizard.getByText("Run Snapshots")).toBeVisible();
  const snapshotCard = wizard.locator("article").filter({ hasText: "Quick 95 Snapshot" }).first();
  await expect(snapshotCard).toBeVisible();

  await wizardStepButton(page, 2, "Session").click();
  await wizard.getByRole("button", { name: "Quick Session" }).click();
  await wizard.getByLabel("Seconds Per Photo").fill("30");
  await wizard.getByLabel("Seconds Per Photo").blur();

  await wizardStepButton(page, 3, "Advanced").click();
  await wizard.getByRole("button", { name: /Session History/i }).click();

  await snapshotCard.getByRole("button", { name: "Restore Snapshot" }).click();

  await wizardStepButton(page, 2, "Session").click();
  await expect(wizard.getByLabel("Seconds Per Photo")).toHaveValue("95");
});

test("live quick timer does not reset when duration input is focused and blurred unchanged", async ({
  page
}) => {
  await page.goto("/");

  await openSetupWizard(page);
  await wizardStepButton(page, 1, "Photos").click();
  await wizardDialog(page).locator("#photoInput").setInputFiles([
    createPngFilePayload("pose-1.png"),
    createPngFilePayload("pose-2.png")
  ]);

  const wizard = wizardDialog(page);
  await wizard.getByRole("button", { name: "Quick Session" }).click();
  const setupDurationInput = wizard.getByLabel("Seconds Per Photo");
  await setupDurationInput.fill("5");
  await setupDurationInput.blur();
  await wizard.getByRole("button", { name: "Start Session" }).click();

  const overlayTimePill = page.locator(".fd-overlay-pill").nth(1);
  await expect(overlayTimePill).toBeVisible();

  await page.waitForTimeout(2100);
  const beforeSeconds = parseClockToSeconds(await overlayTimePill.innerText());
  expect(beforeSeconds).not.toBeNull();

  const liveDurationInput = page.getByLabel("Sec / Photo");
  await liveDurationInput.focus();
  await page.keyboard.press("Tab");

  await page.waitForTimeout(200);
  const afterSeconds = parseClockToSeconds(await overlayTimePill.innerText());
  expect(afterSeconds).not.toBeNull();
  expect(afterSeconds).toBeLessThanOrEqual(beforeSeconds + 1);
});

test("class dialog closes on Escape and restores trigger focus", async ({ page }) => {
  await page.goto("/");

  await openSetupWizard(page);
  await wizardStepButton(page, 2, "Session").click();
  await page.getByRole("button", { name: "Life Class Wizard" }).click();

  const trigger = page.getByRole("button", { name: "Edit Class Plan" });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Life Drawing Class Wizard" });
  await expect(dialog).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("class start opens review grid and allows pose image reassignment before launch", async ({
  page
}) => {
  await page.goto("/");

  await openSetupWizard(page);
  await wizardStepButton(page, 1, "Photos").click();
  await wizardDialog(page).locator("#photoInput").setInputFiles([
    createPngFilePayload("pose-1.png"),
    createPngFilePayload("pose-2.png"),
    createPngFilePayload("pose-3.png")
  ]);

  const wizard = wizardDialog(page);
  await wizardStepButton(page, 2, "Session").click();
  await wizard.getByRole("button", { name: "Life Class Wizard" }).click();
  await wizard.getByRole("button", { name: "Start Class" }).click();

  const reviewDialog = page.getByRole("dialog", { name: "Review Class Pose Grid" });
  await expect(reviewDialog).toBeVisible();

  const cards = reviewDialog.locator("article");
  const firstCard = cards.first();
  const secondCard = cards.nth(1);

  const firstCardDuration = await firstCard.locator("span").nth(1).innerText();
  const secondCardSummary = await secondCard.locator("p").innerText();

  await firstCard.getByRole("button", { name: "Later" }).click();

  await expect(cards.first().locator("span").nth(1)).toHaveText(firstCardDuration);
  await expect(cards.first().locator("p")).toHaveText(secondCardSummary);

  await reviewDialog.getByRole("button", { name: "Start Class" }).click();
  await expect(page.getByRole("button", { name: "End" })).toBeVisible();
});

test("class template sync can persist sync key and push/pull templates", async ({
  page
}) => {
  const remoteSyncState = {
    templates: [
      {
        id: "remote-template-initial",
        name: "Remote Gesture Set",
        blocks: [
          {
            blockType: "pose",
            label: "Remote Gestures",
            durationSeconds: 30,
            poseCount: 6,
            photoTag: "all"
          }
        ],
        createdAt: "2026-03-04T10:00:00.000Z",
        updatedAt: "2026-03-04T10:00:00.000Z"
      }
    ]
  };

  await page.route(`**${TEMPLATE_SYNC_ENDPOINT_PATH}*`, async (route) => {
    const request = route.request();
    const method = request.method();
    const requestUrl = new URL(request.url());
    const syncKey = decodeURIComponent(requestUrl.pathname.split("/").pop() || "");

    if (syncKey !== "studio-sync") {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "unknown-sync-key" })
      });
      return;
    }

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ templates: remoteSyncState.templates })
      });
      return;
    }

    if (method === "PUT") {
      const payload = JSON.parse(request.postData() || "{}");
      remoteSyncState.templates = Array.isArray(payload.templates)
        ? payload.templates
        : [];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ synced: true })
      });
      return;
    }

    await route.fulfill({
      status: 405,
      contentType: "application/json",
      body: JSON.stringify({ error: "method-not-allowed" })
    });
  });

  await page.goto("/");
  await page.evaluate(() => {
    const localTemplates = [
      {
        id: "local-template-1",
        name: "Local Warmups",
        blocks: [
          {
            blockType: "pose",
            label: "Warm-up",
            durationSeconds: 60,
            poseCount: 5,
            photoTag: "all"
          }
        ],
        createdAt: "2026-03-03T08:00:00.000Z",
        updatedAt: "2026-03-03T08:00:00.000Z"
      }
    ];
    window.localStorage.setItem("figureDrawing.classTemplates.v1", JSON.stringify(localTemplates));
    window.localStorage.removeItem("figureDrawing.classTemplateSyncKey.v1");
  });

  await page.reload();
  await openSetupWizard(page);
  await wizardStepButton(page, 2, "Session").click();
  const wizard = wizardDialog(page);
  await wizard.getByRole("button", { name: "Life Class Wizard" }).click();
  await wizard.getByRole("button", { name: "Edit Class Plan" }).click();

  const classDialog = page.getByRole("dialog", { name: "Life Drawing Class Wizard" });
  await expect(classDialog).toBeVisible();
  await expect(classDialog.getByText("Cross-Device Sync")).toBeVisible();

  const syncKeyInput = classDialog.getByLabel("Sync Key");
  await syncKeyInput.fill("studio-sync");
  await expect(syncKeyInput).toHaveValue("studio-sync");

  await expect(classDialog.getByRole("button", { name: "Push To Sync" })).toBeEnabled();
  await expect(classDialog.getByRole("button", { name: "Pull From Sync" })).toBeEnabled();

  const pushRequestPromise = page.waitForRequest((request) => {
    return (
      request.method() === "PUT" &&
      request.url().includes(`${TEMPLATE_SYNC_ENDPOINT_PATH}studio-sync`)
    );
  });
  await classDialog.getByRole("button", { name: "Push To Sync" }).click();
  const pushRequest = await pushRequestPromise;
  const pushedPayload = JSON.parse(pushRequest.postData() || "{}");
  expect(Array.isArray(pushedPayload.templates)).toBe(true);
  expect(
    pushedPayload.templates.some((template) => template.name === "Local Warmups")
  ).toBe(true);

  remoteSyncState.templates = [
    {
      id: "remote-template-new",
      name: "Remote Long Poses",
      blocks: [
        {
          blockType: "pose",
          label: "Remote Long Pose",
          durationSeconds: 300,
          poseCount: 2,
          photoTag: "all"
        }
      ],
      createdAt: "2026-03-04T10:05:00.000Z",
      updatedAt: "2026-03-04T10:05:00.000Z"
    }
  ];

  const pullResponsePromise = page.waitForResponse((response) => {
    const request = response.request();
    return (
      request.method() === "GET" &&
      request.url().includes(`${TEMPLATE_SYNC_ENDPOINT_PATH}studio-sync`) &&
      response.ok()
    );
  });
  await classDialog.getByRole("button", { name: "Pull From Sync" }).click();
  await pullResponsePromise;

  const templateNameValues = await classDialog
    .getByLabel("Template Name")
    .evaluateAll((inputs) => inputs.map((input) => input.value));
  expect(templateNameValues).toContain("Remote Long Poses");

  const persistedSyncKey = await page.evaluate(() =>
    window.localStorage.getItem("figureDrawing.classTemplateSyncKey.v1")
  );
  expect(persistedSyncKey).toBe("studio-sync");
});

test("mode and duration persist after reload", async ({ page }) => {
  await page.goto("/");

  await openSetupWizard(page);
  await wizardStepButton(page, 2, "Session").click();
  await page.getByRole("button", { name: "Quick Session" }).click();
  const durationInput = page.getByLabel("Seconds Per Photo");
  await durationInput.fill("75");
  await durationInput.blur();
  await wizardDialog(page).getByRole("button", { name: "Done", exact: true }).click();

  await page.reload();

  await openSetupWizard(page);
  await wizardStepButton(page, 2, "Session").click();
  await expect(page.getByLabel("Seconds Per Photo")).toHaveValue("75");
});

test("remote page pre-fills offer token from pairing link", async ({ page }) => {
  const offerToken = "test-offer-token-123";
  await page.goto(`/?remote=1&offer=${encodeURIComponent(offerToken)}`);
  await expect(page.getByLabel("Desktop Offer Token")).toHaveValue(offerToken);
});

test("live controls remote diagnostics handle reconnect and retry flow", async ({ page }) => {
  await page.addInitScript(() => {
    class FakeDataChannel {
      constructor(label) {
        this.label = label;
        this.readyState = "connecting";
        this.onopen = null;
        this.onclose = null;
        this.onerror = null;
        this.onmessage = null;
      }

      send() {}

      close() {
        if (this.readyState === "closed") {
          return;
        }

        this.readyState = "closed";
        this.onclose?.();
      }

      open() {
        if (this.readyState === "open") {
          return;
        }

        this.readyState = "open";
        this.onopen?.();
      }
    }

    const peers = [];
    let offerSequence = 0;

    class FakeRTCPeerConnection extends EventTarget {
      constructor() {
        super();
        this.connectionState = "new";
        this.iceConnectionState = "new";
        this.iceGatheringState = "complete";
        this.localDescription = null;
        this.remoteDescription = null;
        this.onconnectionstatechange = null;
        this.oniceconnectionstatechange = null;
        this.ondatachannel = null;
        this._hostChannel = null;
        peers.push(this);
      }

      createDataChannel(label) {
        this._hostChannel = new FakeDataChannel(label);
        return this._hostChannel;
      }

      async createOffer() {
        this.connectionState = "connecting";
        this.iceConnectionState = "checking";
        this.#emitConnectionState();
        offerSequence += 1;
        return {
          type: "offer",
          sdp: `fake-offer-${offerSequence}`
        };
      }

      async setLocalDescription(description) {
        this.localDescription = description;
      }

      async setRemoteDescription(description) {
        this.remoteDescription = description;
        this.connectionState = "connected";
        this.iceConnectionState = "connected";
        this.#emitConnectionState();
        this._hostChannel?.open();
      }

      restartIce() {
        this.connectionState = "connecting";
        this.iceConnectionState = "checking";
        this.#emitConnectionState();
      }

      close() {
        this.connectionState = "closed";
        this.iceConnectionState = "closed";
        this.#emitConnectionState();
        this._hostChannel?.close();
      }

      forceDisconnect() {
        this.connectionState = "disconnected";
        this.iceConnectionState = "disconnected";
        this.#emitConnectionState();
        this._hostChannel?.close();
      }

      #emitConnectionState() {
        this.onconnectionstatechange?.();
        this.oniceconnectionstatechange?.();
      }
    }

    window.RTCPeerConnection = FakeRTCPeerConnection;
    window.RTCSessionDescription = class {
      constructor(init) {
        Object.assign(this, init || {});
      }
    };
    window.__remoteTestHarness = {
      buildAnswerToken() {
        return btoa(
          encodeURIComponent(
            JSON.stringify({
              type: "answer",
              sdp: "fake-answer"
            })
          )
        );
      },
      disconnectLatestPeer() {
        peers.at(-1)?.forceDisconnect();
      }
    };
  });

  await page.goto("/");

  await openSetupWizard(page);
  await wizardStepButton(page, 1, "Photos").click();
  await wizardDialog(page).locator("#photoInput").setInputFiles([createPngFilePayload("remote-pose-1.png")]);

  const wizard = wizardDialog(page);
  await wizard.getByRole("button", { name: "Quick Session" }).click();
  await wizard.getByRole("button", { name: "Start Session" }).click();

  await expect(page.getByRole("button", { name: "End" })).toBeVisible();

  await page.locator('button[aria-controls="advanced-controls-panel"]').click();
  await page.getByRole("button", { name: "Generate Offer" }).click();

  const offerTokenBeforeReconnect = await page
    .getByLabel("Offer Token (send to phone)")
    .inputValue();
  expect(offerTokenBeforeReconnect.length).toBeGreaterThan(0);

  const answerToken = await page.evaluate(() => window.__remoteTestHarness.buildAnswerToken());
  await page.getByLabel("Answer Token (from phone)").fill(answerToken);
  await page.getByRole("button", { name: "Apply Answer" }).click();

  await expect(page.getByText("Status: Connected")).toBeVisible();

  await page.evaluate(() => {
    window.__remoteTestHarness.disconnectLatestPeer();
  });

  await expect(page.getByText("Status: Reconnecting")).toBeVisible();
  await expect(page.getByText("Transient disconnect detected. Waiting for automatic recovery.")).toBeVisible();

  await page.getByRole("button", { name: "Retry Reconnect" }).click();

  await expect(page.getByText("Reconnect offer ready. Generate a new answer token on phone.")).toBeVisible();
  await expect(page.getByText("Status: Connecting")).toBeVisible();

  const offerTokenAfterReconnect = await page
    .getByLabel("Offer Token (send to phone)")
    .inputValue();
  expect(offerTokenAfterReconnect).not.toBe(offerTokenBeforeReconnect);
});

test("remote client shows diagnostics and retry guidance for invalid desktop offer token", async ({
  page
}) => {
  await page.goto("/?remote=1");

  await expect(page.getByText("Connection Diagnostics")).toBeVisible();
  await expect(page.getByText("Status: Idle")).toBeVisible();

  await page.getByLabel("Desktop Offer Token").fill("not-a-valid-token");
  await page.getByRole("button", { name: "Generate Answer Token" }).click();

  await expect(page.getByText("Invalid desktop offer token.")).toBeVisible();
  await expect(page.getByText("Desktop offer token is invalid. Request a fresh offer token.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry Connection" })).toBeVisible();
});
