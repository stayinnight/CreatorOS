import { CampaignRail } from "../components/agent/CampaignRail";
import { useCampaign } from "../app/CampaignProvider";
import { AgentTimeline } from "../components/agent/AgentTimeline";
import { AgentComposer } from "../components/agent/AgentComposer";
import { ContextRail } from "../components/agent/ContextRail";
import { ArtifactInspector } from "../components/agent/ArtifactInspector";
import { useArtifactTransition } from "../components/agent/useArtifactTransition";
import { useChatScroll } from "../components/agent/useChatScroll";
import { useAgentTurn } from "../components/agent/useAgentTurn";
import { useLanguage } from "../i18n/LanguageProvider";
import { formatStatus } from "../i18n/formatters";

export function CampaignDeskPage() {
  const { state, dispatch } = useCampaign();
  const { locale, t } = useLanguage();
  const run = state.agent.runs.find((item) => item.id === state.agent.activeRunId);
  const artifact = state.agent.artifacts.find((item) => item.id === state.agent.selectedArtifactId);
  const transition = useArtifactTransition(state.agent.selectedArtifactId, dispatch);
  const turn = useAgentTurn(state, dispatch);
  const turnRevision = turn.activeTurn ? turn.activeTurn.completedStepCount + ({ Understanding: 0, RunningTools: 10, Composing: 20, Completed: 30 }[turn.activeTurn.phase]) : 0;
  const chatScroll = useChatScroll({ messageCount: state.agent.messages.length, contentRevision: turnRevision });
  const inspectorVisible = Boolean(artifact || transition.openingArtifactId || transition.phase === "closing");
  return <div className={`campaign-desk ${inspectorVisible ? "has-inspector" : ""} inspector-${transition.phase}`}>
    <CampaignRail />
    <main className="agent-stream">
      <header className="desk-header"><div><p className="eyebrow">{t("desk.eyebrow")}</p><h1>Cycling Camera Launch <span>· US / UK</span></h1></div><span className={`run-status ${run?.status.toLowerCase() ?? "ready"}`}>{run ? formatStatus(locale, run.status) : t("desk.ready")}</span></header>
      <section ref={chatScroll.viewportRef} onScroll={chatScroll.onScroll} className="timeline-region" aria-label={t("desk.timeline")}><div ref={chatScroll.contentRef}><AgentTimeline onOpenArtifact={transition.openArtifact} openingArtifactId={transition.openingArtifactId} turn={turn} /></div></section>
      {chatScroll.showJumpToLatest && <button className="jump-to-latest" type="button" onClick={chatScroll.jumpToLatest}>{t("desk.latest")}</button>}
      <AgentComposer turn={turn} />
    </main>
    {artifact ? <ArtifactInspector artifact={artifact} phase={transition.phase} revealKey={transition.revealKey} onClose={transition.closeArtifact} onOpenArtifact={transition.openArtifact} onAskAgent={turn.submit} onPerformAction={turn.performAction} /> : transition.openingArtifactId ? <aside className="artifact-inspector is-opening" aria-label="Opening artifact" aria-busy="true"><div className="inspector-skeleton"><i /><i /><i /><i /></div></aside> : <ContextRail />}
  </div>;
}
