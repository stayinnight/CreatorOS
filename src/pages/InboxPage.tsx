import { Link } from "react-router-dom";
import { useCampaign } from "../app/CampaignProvider";

export function InboxPage() {
  const { state } = useCampaign();
  const run = state.agent.runs.find((item) => item.id === state.agent.activeRunId);
  const status = run?.status ?? "Ready to start";
  const action = status === "WaitingForDecision" ? "Review decisions" : status === "Planned" ? "Review plan" : "Open campaign";
  return <div className="inbox-page">
    <header className="inbox-hero"><div><p className="eyebrow">WORK INBOX · MON 21 SEP</p><h1>What needs your<br /><span>judgment today.</span></h1></div><p>Agent work runs in the background. This inbox only asks for decisions, approvals, and exceptions that need a human.</p></header>
    <section className="inbox-section">
      <div className="inbox-section-head"><div><span className="signal-dot amber" /><strong>Waiting for you</strong></div><span>1 campaign</span></div>
      <article className="campaign-inbox-card priority">
        <div className="campaign-card-index">01</div>
        <div className="campaign-card-main"><span className="micro-label">HEAD-MOUNTED CYCLING CAMERA · US / UK</span><h2>{state.name}</h2><p>{run ? `Agent run is ${status.toLowerCase()}.` : "Three client sources are ready for Agent analysis."}</p></div>
        <div className="campaign-card-meta"><div><span>OWNER</span><strong>Maya Chen</strong></div><div><span>LAUNCH</span><strong>8 weeks</strong></div><div><span>BUDGET</span><strong>$180K</strong></div></div>
        <Link className="inbox-action" to={`/campaigns/${state.id}`}>{action}<span>→</span></Link>
      </article>
    </section>
    <section className="inbox-secondary"><div><span className="signal-dot blue" /><strong>Agent running</strong><small>No campaigns</small></div><div><span className="signal-dot red" /><strong>At risk</strong><small>No campaigns</small></div></section>
  </div>;
}
