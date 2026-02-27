import { computed, ref, watch } from "vue";

export function useSetupWizardFlow({
  sessionMode,
  hasClassPlan,
  hasSourcePhotos
}) {
  const wizardStepCount = 3;
  const wizardStep = ref(1);
  const isWizardOpen = ref(false);

  const isSessionConfigured = computed(() =>
    sessionMode.value === "quick" ? true : hasClassPlan.value
  );

  const canStartSession = computed(() =>
    sessionMode.value === "quick"
      ? hasSourcePhotos.value
      : hasSourcePhotos.value && hasClassPlan.value
  );

  const canAdvanceWizardStep = computed(() => {
    if (wizardStep.value === 1) {
      return true;
    }

    if (wizardStep.value === 2) {
      return isSessionConfigured.value;
    }

    return false;
  });

  function canNavigateToStep(stepNumber) {
    if (stepNumber <= 2) {
      return true;
    }

    return hasSourcePhotos.value && isSessionConfigured.value;
  }

  function wizardStepButtonClass(stepNumber) {
    const baseClass =
      "rounded-md border px-2.5 py-2 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

    if (stepNumber === wizardStep.value) {
      return `${baseClass} border-sky-300/80 bg-sky-100/72 text-sky-900`;
    }

    if (!canNavigateToStep(stepNumber)) {
      return `${baseClass} border-amber-200/80 bg-white/56 text-stone-500`;
    }

    if (stepNumber < wizardStep.value) {
      return `${baseClass} border-emerald-300/80 bg-emerald-100/70 text-emerald-800`;
    }

    return `${baseClass} border-amber-200/90 bg-white/70 text-stone-700 hover:bg-white`;
  }

  function setWizardStep(stepNumber) {
    if (!canNavigateToStep(stepNumber)) {
      return;
    }

    wizardStep.value = Math.min(wizardStepCount, Math.max(1, stepNumber));
  }

  function goToNextWizardStep() {
    if (!canAdvanceWizardStep.value) {
      return;
    }

    wizardStep.value = Math.min(wizardStepCount, wizardStep.value + 1);
  }

  function goToPreviousWizardStep() {
    wizardStep.value = Math.max(1, wizardStep.value - 1);
  }

  function resolveDefaultOpenStep() {
    if (!hasSourcePhotos.value) {
      return 1;
    }

    if (canNavigateToStep(3)) {
      return 3;
    }

    return 2;
  }

  function resolvePreferredStep(preferredStep) {
    const parsedStep = Number(preferredStep);
    if (!Number.isInteger(parsedStep)) {
      return null;
    }

    const normalizedStep = Math.min(wizardStepCount, Math.max(1, parsedStep));
    return canNavigateToStep(normalizedStep) ? normalizedStep : null;
  }

  function openWizard(preferredStep = null) {
    isWizardOpen.value = true;
    wizardStep.value = resolvePreferredStep(preferredStep) || resolveDefaultOpenStep();
  }

  function closeWizard() {
    isWizardOpen.value = false;
  }

  watch(hasSourcePhotos, (hasPhotos) => {
    if (isWizardOpen.value && wizardStep.value === 1 && hasPhotos) {
      wizardStep.value = 2;
    }
  });

  return {
    wizardStepCount,
    wizardStep,
    isWizardOpen,
    canStartSession,
    canAdvanceWizardStep,
    canNavigateToStep,
    wizardStepButtonClass,
    setWizardStep,
    goToNextWizardStep,
    goToPreviousWizardStep,
    openWizard,
    closeWizard
  };
}
