import { useCampaign } from "../../app/CampaignProvider";
import { ArtifactCard } from "./ArtifactCard";
import { DecisionCard } from "./DecisionCard";
import { ExceptionCard } from "./ExceptionCard";
import { NextActionCard } from "./NextActionCard";
import { PlanCard } from "./PlanCard";
import { RunGroupCard } from "./RunGroupCard";

export function AgentTimeline() {
  const { state, dispatch } = useCampaign();
  return <div className="agent-timeline">{state.agent.messages.map((message) => {
    if (message.type === "Plan") {
      const run = state.agent.runs.find((item) => item.id === message.payloadRef);
      if (!run) return null;
      return <PlanCard key={message.id} run={run} steps={state.agent.steps.filter((step) => run.stepIds.includes(step.id))} onStart={() => dispatch({ type: "START_AGENT_RUN" })} />;
    }
    if (message.type === "RunGroup") {
      const run = state.agent.runs.find((item) => item.id === message.payloadRef);
      return <RunGroupCard key={message.id} steps={state.agent.steps.filter((step) => run?.stepIds.includes(step.id)).filter((step) => step.status !== "Pending")} />;
    }
    if (message.type === "Decision") {
      const decision = state.agent.decisions.find((item) => item.id === message.payloadRef);
      if (!decision) return null;
      return <DecisionCard key={message.id} decision={decision} sources={state.brief.sources.filter((source) => decision.evidenceSourceIds.includes(source.id))} onResolve={(value) => dispatch({ type: "RESOLVE_AGENT_DECISION", decisionId: decision.id, value })} />;
    }
    if (message.type === "Artifact") {
      const artifact = state.agent.artifacts.find((item) => item.id === message.payloadRef);
      if (!artifact) return null;
      return <ArtifactCard key={message.id} artifact={artifact} onOpen={() => dispatch({ type: "OPEN_ARTIFACT", artifactId: artifact.id })} />;
    }
    if (message.type === "Exception") {
      const step = state.agent.steps.find((item) => item.id === message.payloadRef);
      return <ExceptionCard key={message.id} message={message} step={step} onRetry={() => message.payloadRef && dispatch({ type: "RETRY_AGENT_STEP", stepId: message.payloadRef })} />;
    }
    if (message.type === "NextAction") return <NextActionCard key={message.id} message={message} onAction={message.payloadRef === "generate-mix" ? () => dispatch({ type: "GENERATE_MIX_OPTIONS" }) : message.payloadRef === "compare-mix" ? () => dispatch({ type: "OPEN_ARTIFACT", artifactId: "artifact-mix-draft" }) : undefined} />;
    return <div className={`chat-message ${message.role.toLowerCase()}`} key={message.id}>{message.text}</div>;
  })}</div>;
}
