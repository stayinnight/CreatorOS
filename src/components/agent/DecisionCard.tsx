import type { BriefSource } from "../../domain/model";
import type { DecisionRequest } from "../../agent/model";

export function DecisionCard({ decision, sources, onResolve }: { decision: DecisionRequest; sources: BriefSource[]; onResolve: (value: string) => void }) {
  return <article className={`agent-card decision-card ${decision.status.toLowerCase()}`}><header><div><span>DECISION REQUIRED</span><strong>{decision.question}</strong></div><em>{decision.status}</em></header><div className="decision-evidence"><span>EVIDENCE</span>{sources.map((source) => <div key={source.id}><strong>{source.type} · {source.title}</strong><p>{source.excerpt}</p></div>)}</div><div className="agent-recommendation"><span>AGENT RECOMMENDS</span><strong>{decision.recommendation}</strong><p>{decision.rationale}</p></div><div className="decision-options">{decision.options.map((option) => <button key={option.id} type="button" disabled={decision.status === "Resolved"} className={decision.resolution === option.value ? "selected" : ""} onClick={() => onResolve(option.value)}><strong>{option.label}</strong><small>{option.impact}</small></button>)}</div></article>;
}
