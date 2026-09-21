import { NavLink } from "react-router-dom";
import { useCampaign } from "../../app/CampaignProvider";

export function CampaignRail() {
  const { state } = useCampaign();
  const run = state.agent.runs.find((item) => item.id === state.agent.activeRunId);
  const status = run?.status ?? "Ready to start";
  return <aside className="campaign-rail">
    <div className="rail-section-label">WORK QUEUES</div>
    <div className="queue-row active"><span className="queue-dot amber" /><strong>Waiting for you</strong><em>{run?.status === "WaitingForDecision" || !run ? 1 : 0}</em></div>
    <div className="queue-row"><span className="queue-dot blue" /><strong>Agent running</strong><em>{run?.status === "Running" ? 1 : 0}</em></div>
    <div className="queue-row"><span className="queue-dot red" /><strong>At risk</strong><em>0</em></div>
    <div className="rail-section-label campaigns-label">ACTIVE CAMPAIGNS</div>
    <NavLink className="rail-campaign active" to={`/campaigns/${state.id}`}>
      <span className="campaign-monogram">CC</span>
      <div><strong>Cycling Camera Launch</strong><small>US / UK · {status}</small></div>
    </NavLink>
  </aside>;
}
