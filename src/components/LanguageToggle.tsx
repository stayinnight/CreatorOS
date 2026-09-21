import { useLanguage } from "../i18n/LanguageProvider";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage();
  return <div className="language-toggle" role="group" aria-label={t("language.label")}>
    <button type="button" aria-pressed={locale === "en"} aria-label={locale === "en" ? t("language.currentEnglish") : t("language.switchEnglish")} onClick={() => setLocale("en")}>EN</button>
    <button type="button" aria-pressed={locale === "zh-CN"} aria-label={locale === "zh-CN" ? t("language.currentChinese") : t("language.switchChinese")} onClick={() => setLocale("zh-CN")}>中文</button>
  </div>;
}
