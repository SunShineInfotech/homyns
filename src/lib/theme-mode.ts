export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "theme_mode";

export const getThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
};

export const applyThemeMode = (mode: ThemeMode) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.style.colorScheme = mode;
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
};
