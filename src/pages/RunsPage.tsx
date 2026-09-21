import { Link } from "react-router-dom";
import { useCampaign } from "../app/CampaignProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { formatStatus } from "../i18n/formatters";

export function RunsPage() {
  const { state } = useCampaign();
  const { locale, t } = useLanguage();
  return <div className="runs-page"><header className="inbox-hero"><div><p className="eyebrow">{t("runs.eyebrow")}</p><h1>{t("runs.titleLead")}<br /><span>{t("runs.titleAccent")}</span></h1></div><p>{t("runs.intro")}</p></header><section className="runs-list">{state.agent.runs.length ? state.agent.runs.map((run) => { const steps = state.agent.steps.filter((step) => run.stepIds.includes(step.id)); const current = steps.find((step) => step.id === run.currentStepId) ?? [...steps].reverse().find((step) => step.status === "Succeeded"); const failures = steps.filter((step) => step.error); return <Link key={run.id} to={`/campaigns/${run.campaignId}/runs/${run.id}`} className={failures.length ? "has-failure" : ""}><span>{formatStatus(locale, run.status)}</span><div><strong>{run.goal}</strong><small>{current ? t("runs.current", { step: current.label }) : t("runs.ready")}</small></div><div className="run-history-meta"><small>{run.startedAt ? new Date(run.startedAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) : t("runs.notStarted")}{run.completedAt ? ` → ${new Date(run.completedAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}` : ""}</small><strong>{t("runs.meta", { artifacts: run.outputArtifactIds.length, failures: failures.length })}</strong></div></Link>; }) : <div className="runs-empty"><strong>{t("runs.empty")}</strong><p>{t("runs.emptyHelp")}</p></div>}</section></div>;
}
