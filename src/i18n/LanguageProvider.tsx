import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translate, type Locale, type TranslationKey, type TranslationParams } from "./messages";

export const LANGUAGE_STORAGE_KEY = "creator-mix-planner:locale:v1";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function initialLocale(): Locale {
  try { return localStorage.getItem(LANGUAGE_STORAGE_KEY) === "zh-CN" ? "zh-CN" : "en"; }
  catch { return "en"; }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  useEffect(() => {
    document.documentElement.lang = locale;
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, locale); } catch { /* keep the in-memory choice */ }
  }, [locale]);
  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    setLocale,
    toggleLocale: () => setLocale((current) => current === "en" ? "zh-CN" : "en"),
    t: (key, params) => translate(locale, key, params),
  }), [locale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
