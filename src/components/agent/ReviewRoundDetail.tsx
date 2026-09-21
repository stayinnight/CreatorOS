import { Link } from "react-router-dom";
import { useCampaign } from "../../app/CampaignProvider";
import { toClientCandidate } from "../../domain/review";

export function ReviewRoundDetail() {
  const { state, dispatch } = useCampaign();
  const publicRows = (state.reviewRound?.candidateIds ?? []).map((id) => state.candidates.find((candidate) => candidate.id === id)).filter((candidate) => candidate !== undefined).map(toClientCandidate);
  return <div className="inspector-body"><div className="batch-summary"><div><span>CLIENT SLATE</span><strong>{publicRows.length}</strong></div><div><span>INTERNAL BACKUPS</span><strong>10</strong></div><div><span>PROJECTION</span><strong>SAFE</strong></div></div><div className="review-detail-table">{publicRows.map((candidate) => <div key={candidate.id}><strong>{candidate.creatorName}</strong><span>{candidate.market} · {candidate.ridingScenario} · {candidate.platform}</span><small>{candidate.quoteRange}</small></div>)}</div><div className="inspector-approval"><div><strong>Client decision simulation</strong><p>Apply the seeded UK Urban passes to demonstrate traceable gap recovery.</p></div><Link to={`/campaigns/${state.id}/client-preview`}>Open client view</Link><button type="button" onClick={() => dispatch({ type: "APPLY_SEEDED_CLIENT_FEEDBACK" })}>Apply feedback →</button></div></div>;
}
