import { test, expect } from "@playwright/test";

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

  await photoCards.nth(2).dragTo(photoCards.nth(0));

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
        templateName: "",
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
        templateName: "Custom Class Plan",
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
        templateName: "",
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
