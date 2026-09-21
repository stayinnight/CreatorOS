import { CampaignRail } from "../components/agent/CampaignRail";
import { useCampaign } from "../app/CampaignProvider";
import { AgentTimeline } from "../components/agent/AgentTimeline";
import { AgentComposer } from "../components/agent/AgentComposer";

export function CampaignDeskPage() {
  const { state } = useCampaign();
  const run = state.agent.runs.find((item) => item.id === state.agent.activeRunId);
  return <div className="campaign-desk">
    <CampaignRail />
    <main className="agent-stream">
      <header className="desk-header"><div><p className="eyebrow">CAMPAIGN AGENT DESK</p><h1>Cycling Camera Launch <span>· US / UK</span></h1></div><span className={`run-status ${run?.status.toLowerCase() ?? "ready"}`}>{run?.status ?? "Ready to start"}</span></header>
      <section className="timeline-region" aria-label="Agent timeline"><AgentTimeline /></section>
      <AgentComposer />
    </main>
    <aside className="context-rail"><div className="context-title"><span className="micro-label">CAMPAIGN CONTEXT</span><h2>Artifacts & decisions</h2></div><div className="context-empty"><strong>No artifacts yet</strong><p>Brief, Mix and candidate batches will appear here as the Agent works.</p></div></aside>
  </div>;
}
