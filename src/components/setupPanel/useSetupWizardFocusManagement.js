import { nextTick, onBeforeUnmount, ref, watch } from "vue";

const FOCUSABLE_SELECTOR = [
  "a[href]:not([tabindex='-1'])",
  "button:not([disabled]):not([tabindex='-1'])",
  "input:not([disabled]):not([type='hidden']):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export function useSetupWizardFocusManagement({
  isWizardOpen,
  wizardDialogRef,
  isClassDialogOpen,
  closeWizard
}) {
  const previousWizardFocusedElement = ref(null);

  function onWizardKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeWizard();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusables = Array.from(
      wizardDialogRef.value?.querySelectorAll(FOCUSABLE_SELECTOR) || []
    ).filter(
      (element) => element instanceof HTMLElement && element.getClientRects().length > 0
    );

    if (focusables.length === 0) {
      event.preventDefault();
      wizardDialogRef.value?.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  watch(isWizardOpen, async (nextOpen) => {
    if (nextOpen) {
      previousWizardFocusedElement.value =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      document.body.style.overflow = "hidden";
      await nextTick();
      wizardDialogRef.value?.focus();
      return;
    }

    if (!isClassDialogOpen.value) {
      document.body.style.overflow = "";
    }
    await nextTick();
    previousWizardFocusedElement.value?.focus();
  });

  watch(isClassDialogOpen, (nextOpen) => {
    if (!nextOpen && isWizardOpen.value) {
      document.body.style.overflow = "hidden";
    }
  });

  onBeforeUnmount(() => {
    if (!isClassDialogOpen.value) {
      document.body.style.overflow = "";
    }
  });

  return {
    onWizardKeydown
  };
}
