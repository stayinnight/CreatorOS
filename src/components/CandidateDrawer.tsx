import { candidateScore } from "../domain/candidate";
import type { CampaignCandidate, Qualification, SearchPackage } from "../domain/model";
import { StatusBadge } from "./StatusBadge";

interface CandidateDrawerProps {
  candidate: CampaignCandidate | null;
  qualification: Qualification | null;
  searchPackage: SearchPackage | null;
  onClose: () => void;
}

export function CandidateDrawer({ candidate, qualification, searchPackage, onClose }: CandidateDrawerProps) {
  if (!candidate || !qualification) return null;
  const score = candidateScore(candidate);
  const evidence = candidate.evidence[0];

  return (
    <aside className="drawer candidate-drawer" aria-label="Candidate detail">
      <div className="drawer-head">
        <div><span className="micro-label">CREATOR EVIDENCE FILE</span><h3>{candidate.creatorName}</h3></div>
        <button type="button" aria-label="Close" onClick={onClose}>×</button>
      </div>
      <p className="drawer-context">{candidate.handle} · {candidate.market} · {candidate.platform} · {candidate.ridingScenario}</p>

      <div className="candidate-hero-score">
        <div><span>WEIGHTED FIT</span><strong>{score.total.toFixed(1)}</strong><small>/ 100</small></div>
        <StatusBadge status={qualification.status} />
      </div>

      <section className="drawer-section">
        <span className="micro-label">WHY THIS CREATOR</span>
        <p>{candidate.internalNote}</p>
        {qualification.reasons.map((reason) => <div className="risk-line fail" key={reason}>× {reason}</div>)}
        {qualification.risks.map((risk) => <div className="risk-line warn" key={risk}>! {risk}</div>)}
      </section>

      <section className="score-breakdown">
        {Object.entries(candidate.scores).map(([label, value]) => (
          <div key={label}><span>{label}</span><div><i style={{ width: `${value}%` }} /></div><strong>{value}</strong></div>
        ))}
      </section>

      <section className="drawer-section">
        <span className="micro-label">VERIFIED CYCLING EVIDENCE</span>
        {evidence ? (
          <div className="evidence-card">
            <div className="evidence-thumb"><span>POV</span><strong>{evidence.ridingScenario}</strong></div>
            <div><strong>{evidence.views.toLocaleString()} relevant views</strong><p>{evidence.proofPoints.join(" · ")}</p><a href={evidence.sourceUrl} target="_blank" rel="noreferrer">Open source ↗</a></div>
          </div>
        ) : <p className="empty-evidence">No source captured. Manual verification required.</p>}
      </section>

      <section className="drawer-section quote-grid">
        <div><span>QUOTE</span><strong>${candidate.quote.total.toLocaleString()}</strong><small>{candidate.quote.status}</small></div>
        <div><span>CELL CEILING</span><strong>{searchPackage ? `$${searchPackage.budgetCeilingPerCreator.toLocaleString()}` : "—"}</strong><small>incl. rights</small></div>
      </section>
      <p className="source-footnote">Evidence verified {evidence?.verifiedAt.slice(0, 10) ?? "not yet"} · Quote valid until {candidate.quote.validUntil}</p>
    </aside>
  );
}
