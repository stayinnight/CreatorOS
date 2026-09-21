import type { AgentRun, RunStep } from "../../agent/model";
import { useLanguage } from "../../i18n/LanguageProvider";
import { localizeSystemText, localizeToolStep } from "../../i18n/agentCopy";

export function PlanCard({ run, steps, onStart }: { run: AgentRun; steps: RunStep[]; onStart: () => void }) {
  const { locale } = useLanguage();
  const copy = locale === "zh-CN" ? { revised: "调整后的计划 · 仅 Brief", proposed: "建议的 RUN", skipped: "已跳过", stop: "本次 Run 将在 Brief v1 发布后停止。", pause: "我会在高影响决策处暂停，并保留来源链路。", start: "开始运行" } : { revised: "REVISED PLAN · BRIEF ONLY", proposed: "PROPOSED RUN", skipped: "Skipped", stop: "This Run stops after Brief v1 is published.", pause: "I’ll pause at high-impact decisions and preserve source lineage.", start: "Start run" };
  return <article className={`agent-card plan-card ${run.scope === "BriefOnly" ? "revised" : ""}`}><header><span>{run.scope === "BriefOnly" ? copy.revised : copy.proposed}</span><strong>{localizeSystemText(locale, run.goal)}</strong></header><ol>{steps.map((step) => <li key={step.id} className={step.status.toLowerCase()}><span>{String(steps.indexOf(step) + 1).padStart(2, "0")}</span>{localizeToolStep(locale, { id: step.id, kind: step.kind === "NormalizeBrief" ? "ExtractBrief" : step.kind === "SourceCandidates" ? "EvaluateQualification" : step.kind === "Calibrate" ? "BuildCalibration" : step.kind, label: step.label, inputRefs: step.inputRefs, summary: step.summary }).label}{step.status === "Skipped" && <em>{copy.skipped}</em>}</li>)}</ol><footer><p>{run.scope === "BriefOnly" ? copy.stop : copy.pause}</p>{run.status === "Planned" && <button type="button" onClick={onStart}>{copy.start} <span>→</span></button>}</footer></article>;
}
