import { useMemo, useState } from "react";
import { useCampaign } from "../../app/CampaignProvider";
import { getCalibrationReadiness, previewRejectImpact } from "../../agent/calibrationReview";
import type { CampaignArtifact, PreferenceImpact, RejectReason } from "../../agent/model";
import { qualifyCandidateDetailed } from "../../domain/qualification";
import { QualificationInspector } from "./QualificationInspector";
import { CalibrationActions } from "./CalibrationActions";
import type { CampaignAction } from "../../app/campaignReducer";
import { useLanguage } from "../../i18n/LanguageProvider";

export function CandidateBatchDetail({ artifact, onAskAgent, onPerformAction }: { artifact: CampaignArtifact; onAskAgent?: (prompt: string, context?: { candidateId?: string }) => void; onPerformAction?: (action: CampaignAction) => boolean }) {
  const { state, dispatch } = useCampaign();
  const { locale } = useLanguage();
  const [impact, setImpact] = useState<PreferenceImpact | null>(null);
  const packageByCell = useMemo(() => new Map(state.searchPackages.map((item) => [item.matrixCellId, item])), [state.searchPackages]);
  const calibration = artifact.domainRef === "calibration-batch-01";
  const ids = calibration ? state.agent.calibrationCandidateIds : [...state.agent.approvedPrimaryIds, ...state.agent.approvedBackupIds];
  const candidates = ids.map((id) => state.candidates.find((candidate) => candidate.id === id)).filter((candidate) => candidate !== undefined);
  const selectedId = state.agent.calibrationSelectedCandidateId && ids.includes(state.agent.calibrationSelectedCandidateId) ? state.agent.calibrationSelectedCandidateId : ids[0];
  const selectedIndex = Math.max(0, ids.indexOf(selectedId));
  const selected = candidates.find((candidate) => candidate.id === selectedId);
  if (!calibration || !selected) return <div className="inspector-body"><div className="batch-summary"><div><span>{locale === "zh-CN" ? "主选" : "PRIMARY"}</span><strong>{state.agent.approvedPrimaryIds.length || 30}</strong></div><div><span>{locale === "zh-CN" ? "备选" : "BACKUP"}</span><strong>{state.agent.approvedBackupIds.length || 10}</strong></div><div><span>{locale === "zh-CN" ? "状态" : "STATUS"}</span><strong>{locale === "zh-CN" ? "就绪" : "Ready"}</strong></div></div></div>;
  const searchPackage = packageByCell.get(selected.matrixCellId);
  if (!searchPackage) return <div className="inspector-placeholder"><strong>{locale === "zh-CN" ? "缺少搜索任务包" : "Search Package missing"}</strong><p>{locale === "zh-CN" ? `无法判断 ${selected.matrixCellId}，请先重新生成 Matrix 搜索包。` : `Cannot evaluate ${selected.matrixCellId}; regenerate Matrix search packages first.`}</p></div>;
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
    <header className="calibration-candidate-nav"><div><span>{locale === "zh-CN" ? "校准" : "CALIBRATION"} · {selectedIndex + 1}/{ids.length}</span><strong>{selected.creatorName}</strong><small>{selected.handle} · {selected.platform} · {selected.matrixCellId}</small></div><div className="calibration-sequence">{ids.map((id, index) => <button aria-label={`${locale === "zh-CN" ? "查看候选" : "View candidate"} ${index + 1}`} className={`${id === selected.id ? "active" : ""} ${state.agent.calibrationReviews.some((item) => item.candidateId === id) ? "reviewed" : ""}`} key={id} onClick={() => selectAt(index)}>{index + 1}</button>)}</div><div className="candidate-nav-buttons"><button aria-label={locale === "zh-CN" ? "上一个候选" : "Previous candidate"} onClick={() => selectAt(selectedIndex - 1)}>←</button><button aria-label={locale === "zh-CN" ? "下一个候选" : "Next candidate"} onClick={() => selectAt(selectedIndex + 1)}>→</button></div></header>
    <QualificationInspector candidate={selected} searchPackage={searchPackage} result={result} onAsk={ask} />
    {impact && <aside className="preference-impact"><div><span>{locale === "zh-CN" ? "影响预览" : "Impact preview"}</span><strong>{impact.label}</strong><p>{locale === "zh-CN" ? `影响同一 Matrix Cell 的 ${impact.affectedCandidateIds.length} 名候选；Brief 与 Locked Matrix 不变。` : `Affects ${impact.affectedCandidateIds.length} candidates in the same Matrix cell; Brief and locked Matrix stay unchanged.`}</p></div><button onClick={() => { dispatch({ type: "APPLY_CALIBRATION_PREFERENCE", impact }); review("Rejected", impact.reason); setImpact(null); }}>{locale === "zh-CN" ? "应用并重排" : "Apply and rerank"}</button><button onClick={() => setImpact(null)}>{locale === "zh-CN" ? "取消" : "Cancel"}</button></aside>}
    <CalibrationActions candidateId={selected.id} readiness={readiness} onReview={(decision) => review(decision)} onPreviewReject={(reason) => setImpact(previewRejectImpact(selected.id, reason, state.candidates))} onConfirmNoAdjustment={() => dispatch({ type: "CONFIRM_NO_CALIBRATION_ADJUSTMENT" })} onApprove={() => onPerformAction ? onPerformAction({ type: "APPROVE_CALIBRATION" }) : dispatch({ type: "APPROVE_CALIBRATION" })} />
  </div>;
}
