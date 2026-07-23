import { createContext, useContext } from "react";
import { DEFAULT_LANGUAGE } from "./translations";

export const I18nContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
});

export function useI18n() {
  return useContext(I18nContext);
}
