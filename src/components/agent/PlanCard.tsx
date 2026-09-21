import type { AgentRun, RunStep } from "../../agent/model";

export function PlanCard({ run, steps, onStart }: { run: AgentRun; steps: RunStep[]; onStart: () => void }) {
  return <article className={`agent-card plan-card ${run.scope === "BriefOnly" ? "revised" : ""}`}><header><span>{run.scope === "BriefOnly" ? "REVISED PLAN · BRIEF ONLY" : "PROPOSED RUN"}</span><strong>{run.goal}</strong></header><ol>{steps.map((step) => <li key={step.id} className={step.status.toLowerCase()}><span>{String(steps.indexOf(step) + 1).padStart(2, "0")}</span>{step.label}{step.status === "Skipped" && <em>Skipped</em>}</li>)}</ol><footer><p>{run.scope === "BriefOnly" ? "This Run stops after Brief v1 is published." : "I’ll pause at high-impact decisions and preserve source lineage."}</p>{run.status === "Planned" && <button type="button" onClick={onStart}>Start run <span>→</span></button>}</footer></article>;
}
