import type { CampaignCandidate, QualificationResult, SearchPackage } from "../../domain/model";

export function QualificationInspector({ candidate, searchPackage, result, onAsk }: { candidate: CampaignCandidate; searchPackage: SearchPackage; result: QualificationResult; onAsk: (prompt: string, candidateId: string) => void }) {
  const prompts = ["为什么推荐他？", "哪条证据证明适合头戴摄像头？", "他有什么风险？", "找同一 Matrix Cell、但更生活化的候选"];
  return <div className="qualification-workspace">
    <div className="qualification-column">
      <section className="qualification-card qualification-verdict" aria-label="Agent verdict">
        <span>AGENT VERDICT</span><div className={`qualification-status ${result.status.toLowerCase().replace(" ", "-")}`}>{result.status}</div>
        <h3>{candidate.creatorName}</h3><p>{result.confidence} confidence · {searchPackage.matrixCellId}</p>
        {result.risks.map((risk) => <div className="qualification-risk" key={risk}>! {risk}</div>)}
      </section>
      <section className="qualification-card qualification-gates" aria-label="Qualification gates">
        <header><span>HARD-RULE CHECKS</span><strong>6 gates</strong></header>
        {result.gates.map((gate) => <div className={`qualification-gate is-${gate.status.toLowerCase()}`} key={gate.id}><i>{gate.status === "Pass" ? "✓" : gate.status === "Fail" ? "×" : "!"}</i><div><strong>{gate.label}</strong><small>{gate.summary}</small></div><em>{gate.status}</em></div>)}
      </section>
      {result.score && <section className="qualification-card fit-score-card"><header><span>FIT / 100</span><strong>{result.score.total.toFixed(0)}</strong></header><div className="fit-breakdown">{Object.entries(result.score.breakdown).map(([key, value]) => <div key={key}><span>{key}</span><b>{value.toFixed(1)}</b></div>)}</div></section>}
    </div>
    <div className="qualification-column">
      <section className="qualification-card qualification-evidence" aria-label="Evidence"><header><span>EVIDENCE</span><strong>{candidate.evidence.length} records</strong></header>{candidate.evidence.length ? candidate.evidence.map((evidence) => <article key={evidence.id}><div><strong>{evidence.ridingScenario} · {evidence.contentFormat}</strong><small>{evidence.sourceType} · {evidence.views.toLocaleString()} views · {evidence.stale ? "Stale" : "Current"}</small></div><div className="evidence-proofs">{evidence.proofPoints.map((point) => <span key={point}>{point}</span>)}</div></article>) : <p className="empty-evidence">没有可核验内容，因此不能通过资格门禁。</p>}</section>
      <section className="qualification-card qualification-agent-prompts" aria-label="Ask Agent"><header><span>ASK AGENT</span><strong>基于当前规则与证据</strong></header>{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => onAsk(prompt, candidate.id)}>{prompt}<span>→</span></button>)}</section>
    </div>
  </div>;
}
