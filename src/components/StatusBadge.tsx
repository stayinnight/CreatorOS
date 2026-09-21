import { useLanguage } from "../i18n/LanguageProvider";
import { formatStatus } from "../i18n/formatters";

export function StatusBadge({ status }: { status: string }) {
  const { locale } = useLanguage();
  const tone = ["Locked", "Published", "Ready", "Enough", "Qualified", "Select", "Success"].includes(status) ? "pass"
    : ["Draft", "Needs Review", "Maybe", "Info"].includes(status) ? "neutral" : "fail";
  return <span className={`status-badge ${tone}`}>{formatStatus(locale, status)}</span>;
}
