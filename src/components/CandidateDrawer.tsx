import { candidateScore } from "../domain/candidate";
import type { CampaignCandidate, Qualification, SearchPackage } from "../domain/model";
import { StatusBadge } from "./StatusBadge";
import { useLanguage } from "../i18n/LanguageProvider";
import { formatDomainValue, formatStatus } from "../i18n/formatters";

interface CandidateDrawerProps {
  candidate: CampaignCandidate | null;
  qualification: Qualification | null;
  searchPackage: SearchPackage | null;
  onClose: () => void;
}

export function CandidateDrawer({ candidate, qualification, searchPackage, onClose }: CandidateDrawerProps) {
  const { locale } = useLanguage();
  if (!candidate || !qualification) return null;
  const score = candidateScore(candidate);
  const evidence = candidate.evidence[0];

  return (
    <aside className="drawer candidate-drawer" aria-label={locale === "zh-CN" ? "候选人详情" : "Candidate detail"}>
      <div className="drawer-head">
        <div><span className="micro-label">{locale === "zh-CN" ? "创作者证据档案" : "CREATOR EVIDENCE FILE"}</span><h3>{candidate.creatorName}</h3></div>
        <button type="button" aria-label={locale === "zh-CN" ? "关闭" : "Close"} onClick={onClose}>×</button>
      </div>
      <p className="drawer-context">{candidate.handle} · {candidate.market} · {candidate.platform} · {formatDomainValue(locale, candidate.ridingScenario)}</p>

      <div className="candidate-hero-score">
        <div><span>{locale === "zh-CN" ? "加权匹配" : "WEIGHTED FIT"}</span><strong>{score.total.toFixed(1)}</strong><small>/ 100</small></div>
        <StatusBadge status={qualification.status} />
      </div>

      <section className="drawer-section">
        <span className="micro-label">{locale === "zh-CN" ? "为什么选择该创作者" : "WHY THIS CREATOR"}</span>
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
        <span className="micro-label">{locale === "zh-CN" ? "已核验骑行证据" : "VERIFIED CYCLING EVIDENCE"}</span>
        {evidence ? (
          <div className="evidence-card">
            <div className="evidence-thumb"><span>POV</span><strong>{formatDomainValue(locale, evidence.ridingScenario)}</strong></div>
            <div><strong>{evidence.views.toLocaleString(locale)} {locale === "zh-CN" ? "次相关播放" : "relevant views"}</strong><p>{evidence.proofPoints.map((point) => formatDomainValue(locale, point)).join(" · ")}</p><a href={evidence.sourceUrl} target="_blank" rel="noreferrer">{locale === "zh-CN" ? "打开来源" : "Open source"} ↗</a></div>
          </div>
        ) : <p className="empty-evidence">{locale === "zh-CN" ? "没有已采集来源，需要人工核验。" : "No source captured. Manual verification required."}</p>}
      </section>

      <section className="drawer-section quote-grid">
        <div><span>{locale === "zh-CN" ? "报价" : "QUOTE"}</span><strong>${candidate.quote.total.toLocaleString(locale)}</strong><small>{formatStatus(locale, candidate.quote.status)}</small></div>
        <div><span>{locale === "zh-CN" ? "单元格上限" : "CELL CEILING"}</span><strong>{searchPackage ? `$${searchPackage.budgetCeilingPerCreator.toLocaleString(locale)}` : "—"}</strong><small>{locale === "zh-CN" ? "含授权" : "incl. rights"}</small></div>
      </section>
      <p className="source-footnote">{locale === "zh-CN" ? "证据核验" : "Evidence verified"} {evidence?.verifiedAt.slice(0, 10) ?? (locale === "zh-CN" ? "尚未" : "not yet")} · {locale === "zh-CN" ? "报价有效期至" : "Quote valid until"} {candidate.quote.validUntil}</p>
    </aside>
  );
}
