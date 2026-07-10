import { useEffect, useState } from "react";
import { DEFAULT_LANGUAGE } from "../i18n/translations";

const STORAGE_KEY = "cvms_language";
const SUPPORTED_LANGUAGES = ["en", "uz"];

function getInitialLanguage() {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const storedLanguage = window.localStorage.getItem(STORAGE_KEY);

  if (storedLanguage === "ru") {
    return "uz";
  }

  if (SUPPORTED_LANGUAGES.includes(storedLanguage)) {
    return storedLanguage;
  }

  return DEFAULT_LANGUAGE;
}

export function useLanguageMode() {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  return {
    language,
    setLanguage: (nextLanguage) => {
      setLanguage(
        SUPPORTED_LANGUAGES.includes(nextLanguage)
          ? nextLanguage
          : DEFAULT_LANGUAGE,
      );
    },
  };
}
