import { useMemo, useState } from "react";
import { useCampaign } from "../../app/CampaignProvider";
import { CandidateDrawer } from "../CandidateDrawer";
import { candidateScore, qualifyCandidate } from "../../domain/candidate";
import type { CampaignArtifact } from "../../agent/model";

const reasons = ["No real cycling", "Too commercial", "Quote too high", "Style mismatch"];

export function CandidateBatchDetail({ artifact }: { artifact: CampaignArtifact }) {
  const { state, dispatch } = useCampaign();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const packageByCell = useMemo(() => new Map(state.searchPackages.map((item) => [item.matrixCellId, item])), [state.searchPackages]);
  const calibration = artifact.domainRef === "calibration-batch-01";
  const ids = calibration ? state.agent.calibrationCandidateIds : state.candidates.filter((candidate) => candidate.role === "Primary" || candidate.role === "Backup").map((candidate) => candidate.id);
  const candidates = ids.map((id) => state.candidates.find((candidate) => candidate.id === id)).filter((candidate) => candidate !== undefined);
  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? null;
  const selectedPackage = selected ? packageByCell.get(selected.matrixCellId) ?? null : null;
  const qualification = selected && selectedPackage ? qualifyCandidate(selected, selectedPackage) : null;
  const rejected = Object.keys(state.agent.calibrationFeedback).length;
  return <div className="inspector-body"><div className="batch-summary"><div><span>TOTAL</span><strong>{candidates.length}</strong></div><div><span>APPROVED DIRECTION</span><strong>{candidates.length - rejected}</strong></div><div><span>FEEDBACK</span><strong>{rejected}</strong></div></div><section className="candidate-calibration-grid">{candidates.map((candidate) => { const searchPackage = packageByCell.get(candidate.matrixCellId); const result = searchPackage ? qualifyCandidate(candidate, searchPackage) : null; const feedback = state.agent.calibrationFeedback[candidate.id]; return <article key={candidate.id} className={feedback ? "rejected" : ""}><header><div><span>{candidate.market} · {candidate.ridingScenario}</span><strong>{candidate.creatorName}</strong><small>{candidate.handle} · {candidate.platform}</small></div><em>{result?.status ?? "Failure case"}</em></header><div className="candidate-score"><strong>{candidateScore(candidate).total.toFixed(0)}</strong><span>FIT / 100</span></div><p>{candidate.internalNote}</p>{feedback ? <div className="feedback-label">Rejected · {feedback}</div> : calibration && <div className="calibration-actions"><button type="button" onClick={() => setSelectedId(candidate.id)}>Inspect</button><button type="button" onClick={() => dispatch({ type: "SEND_AGENT_MESSAGE", text: "为什么推荐他", context: { candidateId: candidate.id } })}>Ask Agent</button><select aria-label={`Reject ${candidate.creatorName}`} defaultValue="" onChange={(event) => event.target.value && dispatch({ type: "REJECT_CALIBRATION_CANDIDATE", candidateId: candidate.id, reason: event.target.value })}><option value="" disabled>Reject…</option>{reasons.map((reason) => <option key={reason}>{reason}</option>)}</select></div>}</article>; })}</section>{calibration && <div className="inspector-approval"><div><strong>Calibration direction</strong><p>Approve the pattern before the Agent expands to 30 client candidates + 10 backups.</p></div><button type="button" onClick={() => dispatch({ type: "APPROVE_CALIBRATION" })}>Approve & expand →</button></div>}<CandidateDrawer candidate={selected} qualification={qualification} searchPackage={selectedPackage} onClose={() => setSelectedId(null)} /></div>;
}
