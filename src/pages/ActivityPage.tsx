import { useCampaign } from "../app/CampaignProvider";
import { simulateFeishuNotification, simulateGmailReference } from "../integrations/simulated";
import { StatusBadge } from "../components/StatusBadge";

export function ActivityPage() {
  const { state } = useCampaign();
  const simulation = [simulateFeishuNotification("Client Review Round 1 task preview"), simulateGmailReference("gmail-thread-01")];
  return <div className="page-stack activity-page">
    <section className="page-intro compact-intro"><div><p className="eyebrow">05 · TRACEABILITY</p><h2>Every decision leaves a trail.</h2></div><p>A lightweight chronological audit—enough to explain what changed without building event-sourcing infrastructure.</p></section>
    <section className="activity-grid">
      <div className="activity-feed panel"><div className="panel-head"><div><span className="micro-label">CAMPAIGN AUDIT</span><h3>{state.activity.length} recorded events</h3></div></div><div className="timeline">{[...state.activity].reverse().map((item) => <div className="timeline-item" key={item.id}><span className={`timeline-dot ${item.status.toLowerCase()}`} /><div><small>{item.at.replace("T", " · ").slice(0, 18)} · {item.kind}</small><strong>{item.message}</strong></div><StatusBadge status={item.status} /></div>)}</div></div>
      <aside className="simulation-panel"><span className="micro-label">INTEGRATION BOUNDARY</span><h3>Preview only</h3><p>No external message is sent in this take-home demo.</p>{simulation.map((item) => <article key={item.id}><div><strong>{item.kind}</strong><StatusBadge status={item.status} /></div><p>{item.message}</p><small>SIMULATED · deterministic fixture</small></article>)}</aside>
    </section>
  </div>;
}
