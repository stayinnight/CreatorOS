import type { CalibrationDecision, RejectReason } from "../../agent/model";
import type { getCalibrationReadiness } from "../../agent/calibrationReview";
import { useLanguage } from "../../i18n/LanguageProvider";
import { formatStatus } from "../../i18n/formatters";

type Readiness = ReturnType<typeof getCalibrationReadiness>;
const reasons: RejectReason[] = ["Too commercial", "Not enough POV evidence", "Audience mismatch", "Quote too high", "No real cycling"];

export function CalibrationActions({ candidateId, readiness, onReview, onPreviewReject, onConfirmNoAdjustment, onApprove }: { candidateId: string; readiness: Readiness; onReview: (decision: CalibrationDecision) => void; onPreviewReject: (reason: RejectReason) => void; onConfirmNoAdjustment: () => void; onApprove: () => void }) {
  const { locale } = useLanguage();
  return <footer className="calibration-action-bar">
    <div className="candidate-review-actions"><button type="button" onClick={() => onReview("Accepted")}>{locale === "zh-CN" ? "接受" : "Accept"}</button><select aria-label={`${locale === "zh-CN" ? "拒绝" : "Reject"} ${candidateId}`} defaultValue="" onChange={(event) => event.target.value && onPreviewReject(event.target.value as RejectReason)}><option value="" disabled>{locale === "zh-CN" ? "选择拒绝原因…" : "Reject with reason…"}</option>{reasons.map((reason) => <option key={reason} value={reason}>{formatStatus(locale, reason)}</option>)}</select><button type="button" onClick={() => onReview("NeedsFollowUp")}>{locale === "zh-CN" ? "需要跟进" : "Needs follow-up"}</button></div>
    <div className="calibration-readiness"><span>{readiness.ready ? (locale === "zh-CN" ? "校准条件已满足" : "Calibration requirements met") : readiness.blockers.join(" · ")}</span>{!readiness.preferenceConfirmed && <button type="button" className="text-button" onClick={onConfirmNoAdjustment}>{locale === "zh-CN" ? "无需调整" : "No adjustment"}</button>}<button type="button" className="approve-slate" disabled={!readiness.ready} onClick={onApprove}>{locale === "zh-CN" ? "批准方向并扩展 30 + 10" : "Approve direction and expand 30 + 10"}</button></div>
  </footer>;
}
