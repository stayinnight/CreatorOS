import { CampaignRail } from "../components/agent/CampaignRail";
import { useCampaign } from "../app/CampaignProvider";
import { AgentTimeline } from "../components/agent/AgentTimeline";
import { AgentComposer } from "../components/agent/AgentComposer";
import { ContextRail } from "../components/agent/ContextRail";
import { ArtifactInspector } from "../components/agent/ArtifactInspector";
import { useArtifactTransition } from "../components/agent/useArtifactTransition";
import { useChatScroll } from "../components/agent/useChatScroll";

export function CampaignDeskPage() {
  const { state, dispatch } = useCampaign();
  const run = state.agent.runs.find((item) => item.id === state.agent.activeRunId);
  const artifact = state.agent.artifacts.find((item) => item.id === state.agent.selectedArtifactId);
  const transition = useArtifactTransition(state.agent.selectedArtifactId, dispatch);
  const chatScroll = useChatScroll(state.agent.messages.length);
  const inspectorVisible = Boolean(artifact || transition.openingArtifactId || transition.phase === "closing");
  return <div className={`campaign-desk ${inspectorVisible ? "has-inspector" : ""} inspector-${transition.phase}`}>
    <CampaignRail />
    <main className="agent-stream">
      <header className="desk-header"><div><p className="eyebrow">CAMPAIGN AGENT DESK</p><h1>Cycling Camera Launch <span>· US / UK</span></h1></div><span className={`run-status ${run?.status.toLowerCase() ?? "ready"}`}>{run?.status ?? "Ready to start"}</span></header>
      <section ref={chatScroll.viewportRef} onScroll={chatScroll.onScroll} className="timeline-region" aria-label="Agent timeline"><div ref={chatScroll.contentRef}><AgentTimeline onOpenArtifact={transition.openArtifact} openingArtifactId={transition.openingArtifactId} /></div></section>
      <AgentComposer />
    </main>
    {artifact ? <ArtifactInspector artifact={artifact} phase={transition.phase} onClose={transition.closeArtifact} onOpenArtifact={transition.openArtifact} /> : transition.openingArtifactId ? <aside className="artifact-inspector is-opening" aria-label="Opening artifact" aria-busy="true"><div className="inspector-skeleton"><i /><i /><i /><i /></div></aside> : <ContextRail />}
  </div>;
}
