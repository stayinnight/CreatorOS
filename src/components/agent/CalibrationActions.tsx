import type { CalibrationDecision, RejectReason } from "../../agent/model";
import type { getCalibrationReadiness } from "../../agent/calibrationReview";

type Readiness = ReturnType<typeof getCalibrationReadiness>;
const reasons: RejectReason[] = ["Too commercial", "Not enough POV evidence", "Audience mismatch", "Quote too high", "No real cycling"];

export function CalibrationActions({ candidateId, readiness, onReview, onPreviewReject, onConfirmNoAdjustment, onApprove }: { candidateId: string; readiness: Readiness; onReview: (decision: CalibrationDecision) => void; onPreviewReject: (reason: RejectReason) => void; onConfirmNoAdjustment: () => void; onApprove: () => void }) {
  return <footer className="calibration-action-bar">
    <div className="candidate-review-actions"><button type="button" onClick={() => onReview("Accepted")}>Accept</button><select aria-label={`Reject ${candidateId}`} defaultValue="" onChange={(event) => event.target.value && onPreviewReject(event.target.value as RejectReason)}><option value="" disabled>Reject with reason…</option>{reasons.map((reason) => <option key={reason}>{reason}</option>)}</select><button type="button" onClick={() => onReview("NeedsFollowUp")}>Needs follow-up</button></div>
    <div className="calibration-readiness"><span>{readiness.ready ? "校准条件已满足" : readiness.blockers.join(" · ")}</span>{!readiness.preferenceConfirmed && <button type="button" className="text-button" onClick={onConfirmNoAdjustment}>无需调整</button>}<button type="button" className="approve-slate" disabled={!readiness.ready} onClick={onApprove}>批准方向并扩展 30 + 10</button></div>
  </footer>;
}
