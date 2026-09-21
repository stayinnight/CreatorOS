import { NavLink } from "react-router-dom";
import { useCampaign } from "../../app/CampaignProvider";
import { useLanguage } from "../../i18n/LanguageProvider";
import { formatStatus } from "../../i18n/formatters";

export function CampaignRail() {
  const { state } = useCampaign();
  const { locale, t } = useLanguage();
  const run = state.agent.runs.find((item) => item.id === state.agent.activeRunId);
  const status = run?.status ?? "Ready to start";
  return <aside className="campaign-rail">
    <div className="rail-section-label">{t("rail.queues")}</div>
    <div className="queue-row active"><span className="queue-dot amber" /><strong>{t("rail.waiting")}</strong><em>{run?.status === "WaitingForDecision" || !run ? 1 : 0}</em></div>
    <div className="queue-row"><span className="queue-dot blue" /><strong>{t("rail.running")}</strong><em>{run?.status === "Running" ? 1 : 0}</em></div>
    <div className="queue-row"><span className="queue-dot red" /><strong>{t("rail.risk")}</strong><em>0</em></div>
    <div className="rail-section-label campaigns-label">{t("rail.campaigns")}</div>
    <NavLink className="rail-campaign active" to={`/campaigns/${state.id}`}>
      <span className="campaign-monogram">CC</span>
      <div><strong>Cycling Camera Launch</strong><small>US / UK · {run ? formatStatus(locale, status) : t("desk.ready")}</small></div>
    </NavLink>
  </aside>;
}
