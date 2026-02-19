import { onBeforeUnmount, onMounted } from "vue";

export function useLiveKeyboardShortcuts({
  isSessionLive,
  onTogglePause,
  onNextSlide,
  onStopSession
}) {
  function handleGlobalKeydown(event) {
    if (!isSessionLive.value) {
      return;
    }

    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target?.isContentEditable
    ) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      onTogglePause();
      return;
    }

    if (event.code === "ArrowRight") {
      event.preventDefault();
      onNextSlide();
      return;
    }

    if (event.code === "Escape") {
      event.preventDefault();
      onStopSession();
    }
  }

  onMounted(() => {
    window.addEventListener("keydown", handleGlobalKeydown);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleGlobalKeydown);
  });
}
