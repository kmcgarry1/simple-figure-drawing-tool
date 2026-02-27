import { ref, watch } from "vue";

const THEME_STORAGE_KEY = "fd-theme-mode";
const LIGHT_MODE = "light";
const DARK_MODE = "dark";
const THEME_VALUES = new Set([LIGHT_MODE, DARK_MODE]);

function isThemeValue(value) {
  return THEME_VALUES.has(value);
}

function getPreferredThemeMode() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return LIGHT_MODE;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? DARK_MODE
    : LIGHT_MODE;
}

function readStoredThemeMode() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeValue(storedValue) ? storedValue : null;
  } catch {
    return null;
  }
}

function writeStoredThemeMode(value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch {
    // Ignore storage write failures, theme still applies in-memory.
  }
}

function applyThemeMode(value) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-theme", value);
  document.documentElement.style.colorScheme = value;
}

export function useThemeMode() {
  const initialThemeMode = readStoredThemeMode() || getPreferredThemeMode();
  const themeMode = ref(initialThemeMode);

  applyThemeMode(themeMode.value);

  watch(
    themeMode,
    (nextMode) => {
      if (!isThemeValue(nextMode)) {
        return;
      }

      applyThemeMode(nextMode);
      writeStoredThemeMode(nextMode);
    },
    { immediate: true }
  );

  function setThemeMode(nextMode) {
    if (!isThemeValue(nextMode)) {
      return;
    }

    themeMode.value = nextMode;
  }

  function toggleThemeMode() {
    setThemeMode(themeMode.value === DARK_MODE ? LIGHT_MODE : DARK_MODE);
  }

  return {
    themeMode,
    setThemeMode,
    toggleThemeMode
  };
}
