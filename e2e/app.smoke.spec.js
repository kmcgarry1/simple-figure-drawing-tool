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

function parseOverlaySeconds(overlayText) {
  const match = overlayText.match(/\|\s*(\d+)s$/);
  if (!match) {
    return null;
  }
  return Number(match[1]);
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

test("quick session flow can start, pause, and end", async ({ page }) => {
  await page.goto("/");

  await openSetupWizard(page);
  await page.getByRole("button", { name: "1. Photos" }).click();
  await page.getByLabel("Upload Photos").setInputFiles([
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
  await page.getByRole("button", { name: "1. Photos" }).click();
  await page.getByLabel("Upload Photos").setInputFiles([
    createPngFilePayload("pose-1.png"),
    createPngFilePayload("pose-2.png"),
    createPngFilePayload("pose-3.png")
  ]);

  const wizard = wizardDialog(page);
  await wizard.getByRole("button", { name: "2. Session" }).click();
  await expect(wizard.getByText("Session Preview")).toBeVisible();
  await expect(wizard.getByText(/Showing (first|all)/)).toBeVisible();
  await expect(wizard.getByText(/Pose 1/)).toBeVisible();
});

test("live quick timer does not reset when duration input is focused and blurred unchanged", async ({
  page
}) => {
  await page.goto("/");

  await openSetupWizard(page);
  await page.getByRole("button", { name: "1. Photos" }).click();
  await page.getByLabel("Upload Photos").setInputFiles([
    createPngFilePayload("pose-1.png"),
    createPngFilePayload("pose-2.png")
  ]);

  const wizard = wizardDialog(page);
  await wizard.getByRole("button", { name: "Quick Session" }).click();
  const setupDurationInput = wizard.getByLabel("Seconds Per Photo");
  await setupDurationInput.fill("5");
  await setupDurationInput.blur();
  await wizard.getByRole("button", { name: "Start Session" }).click();

  const overlayCounter = page
    .locator("span")
    .filter({ hasText: /Slide \d+ \/ \d+ \| \d+s$/ })
    .first();
  await expect(overlayCounter).toBeVisible();

  await page.waitForTimeout(2100);
  const beforeSeconds = parseOverlaySeconds(await overlayCounter.innerText());
  expect(beforeSeconds).not.toBeNull();

  const liveDurationInput = page.getByLabel("Sec / Photo");
  await liveDurationInput.focus();
  await page.keyboard.press("Tab");

  await page.waitForTimeout(200);
  const afterSeconds = parseOverlaySeconds(await overlayCounter.innerText());
  expect(afterSeconds).not.toBeNull();
  expect(afterSeconds).toBeLessThanOrEqual(beforeSeconds + 1);
});

test("class dialog closes on Escape and restores trigger focus", async ({ page }) => {
  await page.goto("/");

  await openSetupWizard(page);
  await page.getByRole("button", { name: "2. Session" }).click();
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
  await page.getByRole("button", { name: "1. Photos" }).click();
  await page.getByLabel("Upload Photos").setInputFiles([
    createPngFilePayload("pose-1.png"),
    createPngFilePayload("pose-2.png"),
    createPngFilePayload("pose-3.png")
  ]);

  const wizard = wizardDialog(page);
  await wizard.getByRole("button", { name: "2. Session" }).click();
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
  await page.getByRole("button", { name: "2. Session" }).click();
  await page.getByRole("button", { name: "Quick Session" }).click();
  const durationInput = page.getByLabel("Seconds Per Photo");
  await durationInput.fill("75");
  await durationInput.blur();
  await page.getByRole("button", { name: "Done" }).click();

  await page.reload();

  await openSetupWizard(page);
  await page.getByRole("button", { name: "2. Session" }).click();
  await expect(page.getByText("2. Quick Session")).toBeVisible();
  await expect(page.getByLabel("Seconds Per Photo")).toHaveValue("75");
});

test("remote page pre-fills offer token from pairing link", async ({ page }) => {
  const offerToken = "test-offer-token-123";
  await page.goto(`/?remote=1&offer=${encodeURIComponent(offerToken)}`);
  await expect(page.getByLabel("Desktop Offer Token")).toHaveValue(offerToken);
});
