import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "cvms_theme";

function getInitialThemeMode() {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  return savedTheme === "dark" ? "dark" : "light";
}

export function useThemeMode() {
  const [themeMode, setThemeMode] = useState(getInitialThemeMode);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  return {
    themeMode,
    isDarkMode: themeMode === "dark",
    setThemeMode,
  };
}
