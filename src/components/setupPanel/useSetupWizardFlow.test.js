import { ref } from "vue";
import { describe, expect, it } from "vitest";
import { useSetupWizardFlow } from "./useSetupWizardFlow";

function createHarness({
  sessionMode = "class",
  hasClassPlan = false,
  hasSourcePhotos = false
} = {}) {
  return useSetupWizardFlow({
    sessionMode: ref(sessionMode),
    hasClassPlan: ref(hasClassPlan),
    hasSourcePhotos: ref(hasSourcePhotos)
  });
}

describe("useSetupWizardFlow", () => {
  it("opens a preferred step when the target step is reachable", () => {
    const flow = createHarness({
      sessionMode: "quick",
      hasClassPlan: true,
      hasSourcePhotos: true
    });

    flow.openWizard(3);

    expect(flow.wizardStep.value).toBe(3);
    expect(flow.isWizardOpen.value).toBe(true);
  });

  it("falls back to a safe default step when preferred step is blocked", () => {
    const flow = createHarness({
      sessionMode: "class",
      hasClassPlan: false,
      hasSourcePhotos: true
    });

    flow.openWizard(3);
    expect(flow.wizardStep.value).toBe(2);

    flow.closeWizard();
    flow.openWizard(999);
    expect(flow.wizardStep.value).toBe(2);
  });

  it("defaults to step 1 when no source photos exist and no preferred step is provided", () => {
    const flow = createHarness({
      sessionMode: "quick",
      hasClassPlan: true,
      hasSourcePhotos: false
    });

    flow.openWizard();

    expect(flow.wizardStep.value).toBe(1);
  });
});
