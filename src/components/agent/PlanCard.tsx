import type { AgentRun, RunStep } from "../../agent/model";

export function PlanCard({ run, steps, onStart }: { run: AgentRun; steps: RunStep[]; onStart: () => void }) {
  return <article className="agent-card plan-card"><header><span>PROPOSED RUN</span><strong>{run.goal}</strong></header><ol>{steps.map((step) => <li key={step.id}><span>{String(steps.indexOf(step) + 1).padStart(2, "0")}</span>{step.label}</li>)}</ol><footer><p>I’ll pause at high-impact decisions and preserve source lineage.</p>{run.status === "Planned" && <button type="button" onClick={onStart}>Start run <span>→</span></button>}</footer></article>;
}
