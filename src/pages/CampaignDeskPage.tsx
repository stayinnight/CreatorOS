import { CampaignRail } from "../components/agent/CampaignRail";
import { useCampaign } from "../app/CampaignProvider";
import { AgentTimeline } from "../components/agent/AgentTimeline";
import { AgentComposer } from "../components/agent/AgentComposer";
import { ContextRail } from "../components/agent/ContextRail";
import { ArtifactInspector } from "../components/agent/ArtifactInspector";

export function CampaignDeskPage() {
  const { state } = useCampaign();
  const run = state.agent.runs.find((item) => item.id === state.agent.activeRunId);
  const artifact = state.agent.artifacts.find((item) => item.id === state.agent.selectedArtifactId);
  return <div className={`campaign-desk ${artifact ? "has-inspector" : ""}`}>
    <CampaignRail />
    <main className="agent-stream">
      <header className="desk-header"><div><p className="eyebrow">CAMPAIGN AGENT DESK</p><h1>Cycling Camera Launch <span>· US / UK</span></h1></div><span className={`run-status ${run?.status.toLowerCase() ?? "ready"}`}>{run?.status ?? "Ready to start"}</span></header>
      <section className="timeline-region" aria-label="Agent timeline"><AgentTimeline /></section>
      <AgentComposer />
    </main>
    {artifact ? <ArtifactInspector artifact={artifact} /> : <ContextRail />}
  </div>;
}
