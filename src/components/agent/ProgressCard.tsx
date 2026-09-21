import { useLanguage } from "../../i18n/LanguageProvider";

export function ProgressCard({ current, completed, total, nextLabel }: { current: string; completed: number; total: number; nextLabel: string | null }) {
  const { locale } = useLanguage();
  const percentage = total ? Math.round((completed / total) * 100) : 100;
  return <article className="agent-card progress-card">
    <header><span>{locale === "zh-CN" ? "RUN 进度" : "RUN PROGRESS"}</span><strong>{current}</strong></header>
    <div className="progress-summary"><strong>{`${completed} / ${total}`}</strong><span>{locale === "zh-CN" ? "个步骤已完成" : "steps complete"}</span></div>
    <div className="progress-track" aria-label={locale === "zh-CN" ? `${percentage}% 已完成` : `${percentage}% complete`}><i style={{ width: `${percentage}%` }} /></div>
    {nextLabel && <p>{locale === "zh-CN" ? "下一步：" : "Next: "}<strong>{nextLabel}</strong></p>}
  </article>;
}
