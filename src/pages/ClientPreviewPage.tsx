import { Link } from "react-router-dom";
import { useCampaign } from "../app/CampaignProvider";
import { toClientCandidate } from "../domain/review";
import { useLanguage } from "../i18n/LanguageProvider";
import { formatDomainValue } from "../i18n/formatters";

export function ClientPreviewPage() {
  const { state } = useCampaign();
  const { locale, t } = useLanguage();
  const candidateIds = state.reviewRound?.candidateIds ?? state.candidates.filter((candidate) => candidate.role === "Primary").slice(0, 30).map((candidate) => candidate.id);
  const candidates = candidateIds.map((id) => state.candidates.find((candidate) => candidate.id === id)).filter((candidate) => candidate !== undefined).map(toClientCandidate);
  return <div className="client-preview-page"><header className="client-preview-head"><div><span>{t("preview.eyebrow")}</span><h1>{t("preview.title")}</h1><p>{t("preview.round")}</p></div><Link to={`/campaigns/${state.id}`}>{t("preview.back")}</Link></header><div className="projection-banner"><strong>{t("preview.candidates", { count: candidates.length || 30 })}</strong><span>{t("preview.safe")}</span></div><section className="client-preview-grid">{candidates.length ? candidates.map((candidate) => <article key={candidate.id}><header><span>{candidate.market} · {formatDomainValue(locale, candidate.ridingScenario)}</span><strong>{candidate.creatorName}</strong><small>{candidate.handle} · {candidate.platform}</small></header><div className="preview-evidence"><span>{t("preview.evidence")}</span><strong>{t("preview.views", { count: candidate.evidence[0]?.views.toLocaleString(locale) ?? "—" })}</strong><small>{candidate.evidence[0]?.proofPoints.slice(0, 3).map((point) => formatDomainValue(locale, point)).join(" · ")}</small></div><dl><div><dt>{t("preview.deliverable")}</dt><dd>{candidate.deliverables}</dd></div><div><dt>{t("preview.quote")}</dt><dd>{candidate.quoteRange}</dd></div><div><dt>{t("preview.rights")}</dt><dd>{candidate.rightsSummary}</dd></div><div><dt>{t("preview.forecast")}</dt><dd>{candidate.forecastViews.toLocaleString(locale)}</dd></div></dl></article>) : <div className="client-preview-empty">{t("preview.empty")}</div>}</section></div>;
}
