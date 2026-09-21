import type { RunStep } from "../../agent/model";
import { useLanguage } from "../../i18n/LanguageProvider";
import { formatStatus } from "../../i18n/formatters";
import { localizeToolStep } from "../../i18n/agentCopy";

export function RunGroupCard({ steps }: { steps: RunStep[] }) {
  const { locale } = useLanguage();
  return <article className="agent-card run-group-card"><header><span>{locale === "zh-CN" ? "AGENT 执行过程" : "AGENT EXECUTION"}</span><strong>{locale === "zh-CN" ? "原始材料分析" : "Source analysis"}</strong></header><div className="step-list">{steps.map((step) => { const toolKind = step.kind === "NormalizeBrief" ? "ExtractBrief" : step.kind === "SourceCandidates" ? "EvaluateQualification" : step.kind === "Calibrate" ? "BuildCalibration" : step.kind; const localized = localizeToolStep(locale, { id: step.id, kind: toolKind, label: step.label, inputRefs: step.inputRefs, summary: step.summary }); return <div key={step.id} className={`step-row ${step.status.toLowerCase()}`}><i>{step.status === "Succeeded" ? "✓" : step.status === "Failed" ? "!" : "·"}</i><div><strong>{localized.label}</strong><small>{step.summary ? localized.summary : formatStatus(locale, step.status)}</small></div><em>{formatStatus(locale, step.status)}</em></div>; })}</div></article>;
}
