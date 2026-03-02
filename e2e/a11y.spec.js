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

function setupWizardDialog(page) {
  return page.getByRole("dialog", { name: "Setup Wizard" });
}

function wizardStepButton(page, stepNumber, stepTitle) {
  return setupWizardDialog(page).getByRole("button", {
    name: new RegExp(`Step\\s*${stepNumber}[\\s\\S]*${stepTitle}`, "i")
  });
}

async function openSetupWizard(page) {
  const wizard = setupWizardDialog(page);
  if (await wizard.isVisible()) {
    return;
  }

  await page.getByRole("button", { name: /Setup Wizard/ }).click();
  await expect(wizard).toBeVisible();
}

async function expectNoCriticalOrSeriousViolations(page, { include }) {
  const builder = new AxeBuilder({ page });
  if (include) {
    builder.include(include);
  }

  const analysis = await builder
    // Contrast tuning is handled separately; keep this gate focused on structural/accessibility errors.
    .disableRules(["color-contrast"])
    .analyze();

  const seriousViolations = analysis.violations.filter((violation) =>
    ["critical", "serious"].includes(String(violation.impact))
  );

  expect(seriousViolations).toEqual([]);
}

test("landing view has no critical/serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();
  await expectNoCriticalOrSeriousViolations(page, { include: "body" });
});

test("setup wizard has no critical/serious accessibility violations", async ({ page }) => {
  await page.goto("/");

  await openSetupWizard(page);
  await wizardStepButton(page, 1, "Photos").click();
  await setupWizardDialog(page).locator("#photoInput").setInputFiles([
    createPngFilePayload("a11y-pose-1.png"),
    createPngFilePayload("a11y-pose-2.png")
  ]);

  await wizardStepButton(page, 3, "Advanced").click();
  await expectNoCriticalOrSeriousViolations(page, { include: '[role="dialog"][aria-modal="true"]' });
});
