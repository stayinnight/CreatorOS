import type { AgentMessage, RunStep } from "../../agent/model";
import { useLanguage } from "../../i18n/LanguageProvider";
import { localizeAgentMessage, localizeToolStep } from "../../i18n/agentCopy";

export function ExceptionCard({ message, step, onRetry }: { message: AgentMessage; step?: RunStep; onRetry: () => void }) {
  const { locale } = useLanguage();
  const stepLabel = step ? localizeToolStep(locale, { id: step.id, kind: step.kind === "NormalizeBrief" ? "ExtractBrief" : step.kind === "SourceCandidates" ? "EvaluateQualification" : step.kind === "Calibrate" ? "BuildCalibration" : step.kind, label: step.label, inputRefs: step.inputRefs, summary: step.summary }).label : (locale === "zh-CN" ? "Agent 步骤失败" : "Agent step failed");
  return <article className="agent-card exception-card"><span>{locale === "zh-CN" ? "异常 · 局部失败" : "EXCEPTION · LOCAL FAILURE"}</span><strong>{stepLabel}</strong><p>{localizeAgentMessage(locale, message)}</p><button type="button" onClick={onRetry}>{locale === "zh-CN" ? "重试此步骤" : "Retry this step"}</button></article>;
}
