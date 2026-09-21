import { Link } from "react-router-dom";
import { useCampaign } from "../../app/CampaignProvider";
import { toClientCandidate } from "../../domain/review";
import { useLanguage } from "../../i18n/LanguageProvider";
import { formatDomainValue } from "../../i18n/formatters";

export function ReviewRoundDetail() {
  const { state, dispatch } = useCampaign();
  const { locale } = useLanguage();
  const publicRows = (state.reviewRound?.candidateIds ?? []).map((id) => state.candidates.find((candidate) => candidate.id === id)).filter((candidate) => candidate !== undefined).map(toClientCandidate);
  return <div className="inspector-body"><div className="batch-summary"><div><span>{locale === "zh-CN" ? "客户名单" : "CLIENT SLATE"}</span><strong>{publicRows.length}</strong></div><div><span>{locale === "zh-CN" ? "内部备选" : "INTERNAL BACKUPS"}</span><strong>10</strong></div><div><span>{locale === "zh-CN" ? "投影视图" : "PROJECTION"}</span><strong>{locale === "zh-CN" ? "安全" : "SAFE"}</strong></div></div><div className="review-detail-table">{publicRows.map((candidate) => <div key={candidate.id}><strong>{candidate.creatorName}</strong><span>{candidate.market} · {formatDomainValue(locale, candidate.ridingScenario)} · {candidate.platform}</span><small>{candidate.quoteRange}</small></div>)}</div><div className="inspector-approval"><div><strong>{locale === "zh-CN" ? "客户决策模拟" : "Client decision simulation"}</strong><p>{locale === "zh-CN" ? "应用预置的 UK Urban Pass，演示可追溯的缺口修复。" : "Apply the seeded UK Urban passes to demonstrate traceable gap recovery."}</p></div><Link to={`/campaigns/${state.id}/client-preview`}>{locale === "zh-CN" ? "打开客户视图" : "Open client view"}</Link><button type="button" onClick={() => dispatch({ type: "APPLY_SEEDED_CLIENT_FEEDBACK" })}>{locale === "zh-CN" ? "应用反馈" : "Apply feedback"} →</button></div></div>;
}
