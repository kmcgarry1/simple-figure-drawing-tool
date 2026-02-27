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
  await page.getByRole("button", { name: /Setup Wizard/ }).click();
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
