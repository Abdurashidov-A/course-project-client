import { useMemo } from "react";
import { useLanguageMode } from "../hooks/useLanguageMode";
import { DEFAULT_LANGUAGE, translations } from "./translations";
import { I18nContext } from "./i18nContext";

function interpolate(template, params) {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (result, [paramKey, paramValue]) =>
      result.replaceAll(`{${paramKey}}`, String(paramValue)),
    template,
  );
}

export function I18nProvider({ children }) {
  const { language, setLanguage } = useLanguageMode();

  const value = useMemo(() => {
    const dictionary = translations[language] || translations[DEFAULT_LANGUAGE];

    function t(key, fallback, params) {
      const template =
        dictionary?.[key] ??
        translations[DEFAULT_LANGUAGE]?.[key] ??
        fallback ??
        key;

      return interpolate(template, params);
    }

    return {
      language,
      setLanguage,
      t,
    };
  }, [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
