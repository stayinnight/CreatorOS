import type { RunStep } from "../../agent/model";

export function RunGroupCard({ steps }: { steps: RunStep[] }) {
  return <article className="agent-card run-group-card"><header><span>AGENT EXECUTION</span><strong>Source analysis</strong></header><div className="step-list">{steps.map((step) => <div key={step.id} className={`step-row ${step.status.toLowerCase()}`}><i>{step.status === "Succeeded" ? "✓" : step.status === "Failed" ? "!" : "·"}</i><div><strong>{step.label}</strong><small>{step.summary || step.status}</small></div><em>{step.status}</em></div>)}</div></article>;
}
