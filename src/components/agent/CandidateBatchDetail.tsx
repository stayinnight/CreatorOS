import { useMemo, useState } from "react";
import { useCampaign } from "../../app/CampaignProvider";
import { getCalibrationReadiness, previewRejectImpact } from "../../agent/calibrationReview";
import type { CampaignArtifact, PreferenceImpact, RejectReason } from "../../agent/model";
import { qualifyCandidateDetailed } from "../../domain/qualification";
import { QualificationInspector } from "./QualificationInspector";
import { CalibrationActions } from "./CalibrationActions";

export function CandidateBatchDetail({ artifact, onAskAgent }: { artifact: CampaignArtifact; onAskAgent?: (prompt: string, context?: { candidateId?: string }) => void }) {
  const { state, dispatch } = useCampaign();
  const [impact, setImpact] = useState<PreferenceImpact | null>(null);
  const packageByCell = useMemo(() => new Map(state.searchPackages.map((item) => [item.matrixCellId, item])), [state.searchPackages]);
  const calibration = artifact.domainRef === "calibration-batch-01";
  const ids = calibration ? state.agent.calibrationCandidateIds : [...state.agent.approvedPrimaryIds, ...state.agent.approvedBackupIds];
  const candidates = ids.map((id) => state.candidates.find((candidate) => candidate.id === id)).filter((candidate) => candidate !== undefined);
  const selectedId = state.agent.calibrationSelectedCandidateId && ids.includes(state.agent.calibrationSelectedCandidateId) ? state.agent.calibrationSelectedCandidateId : ids[0];
  const selectedIndex = Math.max(0, ids.indexOf(selectedId));
  const selected = candidates.find((candidate) => candidate.id === selectedId);
  if (!calibration || !selected) return <div className="inspector-body"><div className="batch-summary"><div><span>PRIMARY</span><strong>{state.agent.approvedPrimaryIds.length || 30}</strong></div><div><span>BACKUP</span><strong>{state.agent.approvedBackupIds.length || 10}</strong></div><div><span>STATUS</span><strong>Ready</strong></div></div></div>;
  const searchPackage = packageByCell.get(selected.matrixCellId);
  if (!searchPackage) return <div className="inspector-placeholder"><strong>Search Package missing</strong><p>无法判断 {selected.matrixCellId}，请先重新生成 Matrix 搜索包。</p></div>;
  const qualificationById = Object.fromEntries(candidates.map((candidate) => [candidate.id, qualifyCandidateDetailed(candidate, packageByCell.get(candidate.matrixCellId)!)]));
  const result = qualificationById[selected.id];
  const readiness = getCalibrationReadiness(state.agent.calibrationReviews, qualificationById, state.agent.calibrationPreferenceConfirmed);
  const selectAt = (index: number) => dispatch({ type: "SELECT_CALIBRATION_CANDIDATE", candidateId: ids[(index + ids.length) % ids.length] });
  const review = (decision: "Accepted" | "Rejected" | "NeedsFollowUp", reason?: RejectReason) => {
    dispatch({ type: "REVIEW_CALIBRATION_CANDIDATE", candidateId: selected.id, decision, reason });
    selectAt(selectedIndex + 1);
  };
  const ask = (prompt: string, candidateId: string) => onAskAgent ? onAskAgent(prompt, { candidateId }) : dispatch({ type: "SEND_AGENT_MESSAGE", text: prompt, context: { candidateId } });
  return <div className="calibration-shell">
    <header className="calibration-candidate-nav"><div><span>CALIBRATION · {selectedIndex + 1}/{ids.length}</span><strong>{selected.creatorName}</strong><small>{selected.handle} · {selected.platform} · {selected.matrixCellId}</small></div><div className="calibration-sequence">{ids.map((id, index) => <button aria-label={`查看候选 ${index + 1}`} className={`${id === selected.id ? "active" : ""} ${state.agent.calibrationReviews.some((item) => item.candidateId === id) ? "reviewed" : ""}`} key={id} onClick={() => selectAt(index)}>{index + 1}</button>)}</div><div className="candidate-nav-buttons"><button aria-label="上一个候选" onClick={() => selectAt(selectedIndex - 1)}>←</button><button aria-label="下一个候选" onClick={() => selectAt(selectedIndex + 1)}>→</button></div></header>
    <QualificationInspector candidate={selected} searchPackage={searchPackage} result={result} onAsk={ask} />
    {impact && <aside className="preference-impact"><div><span>影响预览</span><strong>{impact.label}</strong><p>影响同一 Matrix Cell 的 {impact.affectedCandidateIds.length} 名候选；Brief 与 Locked Matrix 不变。</p></div><button onClick={() => { dispatch({ type: "APPLY_CALIBRATION_PREFERENCE", impact }); review("Rejected", impact.reason); setImpact(null); }}>应用并重排</button><button onClick={() => setImpact(null)}>取消</button></aside>}
    <CalibrationActions candidateId={selected.id} readiness={readiness} onReview={(decision) => review(decision)} onPreviewReject={(reason) => setImpact(previewRejectImpact(selected.id, reason, state.candidates))} onConfirmNoAdjustment={() => dispatch({ type: "CONFIRM_NO_CALIBRATION_ADJUSTMENT" })} onApprove={() => dispatch({ type: "APPROVE_CALIBRATION" })} />
  </div>;
}
