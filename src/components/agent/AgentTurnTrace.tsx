import type { AgentToolStepRecord } from "../../agent/model";

export type AgentTurnPhase = "Understanding" | "RunningTools" | "Composing" | "Completed";

export function AgentTurnTrace({ phase, understanding, steps, completedStepCount }: { phase: AgentTurnPhase; understanding: string; steps: AgentToolStepRecord[]; completedStepCount: number }) {
  if (phase === "Completed") return <details className="agent-turn-trace is-complete"><summary>{`使用 ${steps.length} 项工作区检查完成分析 · 查看过程`}</summary><div>{steps.map((step) => <p key={step.id}><i>✓</i><span>{step.summary}</span></p>)}</div></details>;
  return <section className="agent-turn-trace" role="status" aria-label="Agent 执行状态" aria-live="polite"><header><span className="working-mark" /><div><strong>{phase === "Understanding" ? "思考 · 正在理解任务" : phase === "Composing" ? "回答 · 正在组织结果" : "行动 · 正在调用工具"}</strong><small>{understanding}</small></div></header>{phase !== "Understanding" && <div className="agent-tool-list">{steps.map((step, index) => { const status = index < completedStepCount ? "Done" : index === completedStepCount && phase === "RunningTools" ? "Running" : "Pending"; return <div className={`agent-tool-step is-${status.toLowerCase()}`} key={step.id}><i>{status === "Done" ? "✓" : status === "Running" ? <span className="working-mark" /> : "·"}</i><span>{step.label}</span><em>{status}</em></div>; })}</div>}</section>;
}
