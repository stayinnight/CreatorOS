import { Link } from "react-router-dom";
import { useCampaign } from "../app/CampaignProvider";
import { useLanguage } from "../i18n/LanguageProvider";

export function InboxPage() {
  const { state } = useCampaign();
  const { t } = useLanguage();
  const run = state.agent.runs.find((item) => item.id === state.agent.activeRunId);
  const status = run?.status ?? "Ready to start";
  const action = status === "WaitingForDecision" ? t("inbox.reviewDecisions") : status === "Planned" ? t("inbox.reviewPlan") : t("inbox.openCampaign");
  return <div className="inbox-page">
    <header className="inbox-hero"><div><p className="eyebrow">{t("inbox.eyebrow")}</p><h1>{t("inbox.titleLead")}<br /><span>{t("inbox.titleAccent")}</span></h1></div><p>{t("inbox.intro")}</p></header>
    <section className="inbox-section">
      <div className="inbox-section-head"><div><span className="signal-dot amber" /><strong>{t("inbox.waiting")}</strong></div><span>{t("inbox.oneCampaign")}</span></div>
      <article className="campaign-inbox-card priority">
        <div className="campaign-card-index">01</div>
        <div className="campaign-card-main"><span className="micro-label">HEAD-MOUNTED CYCLING CAMERA · US / UK</span><h2>{state.name}</h2><p>{run ? t("inbox.runStatus", { status: status.toLowerCase() }) : t("inbox.readySources")}</p></div>
        <div className="campaign-card-meta"><div><span>{t("inbox.owner")}</span><strong>Maya Chen</strong></div><div><span>{t("inbox.launch")}</span><strong>{t("inbox.weeks")}</strong></div><div><span>{t("inbox.budget")}</span><strong>$180K</strong></div></div>
        <Link className="inbox-action" to={`/campaigns/${state.id}`}>{action}<span>→</span></Link>
      </article>
    </section>
    <section className="inbox-secondary"><div><span className="signal-dot blue" /><strong>{t("inbox.agentRunning")}</strong><small>{t("inbox.noCampaigns")}</small></div><div><span className="signal-dot red" /><strong>{t("inbox.atRisk")}</strong><small>{t("inbox.noCampaigns")}</small></div></section>
  </div>;
}
