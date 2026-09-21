import type { AgentToolStepRecord } from "../../agent/model";
import { useLanguage } from "../../i18n/LanguageProvider";
import { localizeToolStep } from "../../i18n/agentCopy";

export type AgentTurnPhase = "Understanding" | "RunningTools" | "Composing" | "Completed";

export function AgentTurnTrace({ phase, understanding, steps, completedStepCount }: { phase: AgentTurnPhase; understanding: string; steps: AgentToolStepRecord[]; completedStepCount: number }) {
  const { locale, t } = useLanguage();
  const localizedSteps = steps.map((step) => localizeToolStep(locale, step));
  if (phase === "Completed") return <details className="agent-turn-trace is-complete"><summary>{t("agent.phase.completed", { count: steps.length })}</summary><div>{localizedSteps.map((step) => <p key={step.id}><i>✓</i><span>{step.summary}</span></p>)}</div></details>;
  const phaseKey = phase === "Understanding" ? "agent.phase.thinking" : phase === "Composing" ? "agent.phase.answer" : "agent.phase.action";
  return <section className="agent-turn-trace" role="status" aria-label={locale === "zh-CN" ? "Agent 执行状态" : "Agent execution status"} aria-live="polite"><header><span className="working-mark" /><div><strong>{t(phaseKey)}</strong><small>{understanding}</small></div></header>{phase !== "Understanding" && <div className="agent-tool-list">{localizedSteps.map((step, index) => { const status = index < completedStepCount ? "Done" : index === completedStepCount && phase === "RunningTools" ? "Running" : "Pending"; return <div className={`agent-tool-step is-${status.toLowerCase()}`} key={step.id}><i>{status === "Done" ? "✓" : status === "Running" ? <span className="working-mark" /> : "·"}</i><span>{step.label}</span><em>{status}</em></div>; })}</div>}</section>;
}
