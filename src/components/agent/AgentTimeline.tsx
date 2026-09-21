import { useCampaign } from "../../app/CampaignProvider";
import { ArtifactCard } from "./ArtifactCard";
import { DecisionCard } from "./DecisionCard";
import { ExceptionCard } from "./ExceptionCard";
import { NextActionCard } from "./NextActionCard";
import { PlanCard } from "./PlanCard";
import { RunGroupCard } from "./RunGroupCard";
import { ProgressCard } from "./ProgressCard";
import { getActionLifecycle, getRecommendedNextAction, type RecommendedActionId } from "../../agent/recommendedAction";
import { executeRecommendedAction } from "../../agent/executeRecommendedAction";
import { useNavigate } from "react-router-dom";

const legacyActionIds: Record<string, RecommendedActionId> = {
  "generate-mix": "build-mix",
  "prepare-review": "validate-slate",
  "publish-review": "preview-client",
};

export function AgentTimeline() {
  const { state, dispatch } = useCampaign();
  const navigate = useNavigate();
  const recommendation = getRecommendedNextAction(state);
  const lastActionIndex = new Map<string, number>();
  state.agent.messages.forEach((message, index) => { if (message.type === "NextAction" && message.payloadRef) lastActionIndex.set(message.payloadRef, index); });
  return <div className="agent-timeline">{state.agent.messages.map((message, messageIndex) => {
    if (message.type === "Plan") {
      const run = state.agent.runs.find((item) => item.id === message.payloadRef);
      if (!run) return null;
      return <PlanCard key={message.id} run={run} steps={state.agent.steps.filter((step) => step.runId === run.id && run.stepIds.includes(step.id))} onStart={() => dispatch({ type: "START_AGENT_RUN" })} />;
    }
    if (message.type === "RunGroup") {
      const run = state.agent.runs.find((item) => item.id === message.payloadRef);
      return <RunGroupCard key={message.id} steps={state.agent.steps.filter((step) => step.runId === run?.id && run?.stepIds.includes(step.id)).filter((step) => step.status !== "Pending")} />;
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
    if (message.type === "NextAction") {
      const recommendedId = message.payloadRef?.startsWith("recommended:") ? message.payloadRef.slice("recommended:".length) as RecommendedActionId : null;
      const mappedId = recommendedId ?? (message.payloadRef ? legacyActionIds[message.payloadRef] : undefined);
      const isLastDuplicate = !message.payloadRef || lastActionIndex.get(message.payloadRef) === messageIndex;
      const compareCurrent = message.payloadRef === "compare-mix" && (recommendation?.id === "lock-matrix" || recommendation?.id === "review-matrix");
      const compareComplete = message.payloadRef === "compare-mix" && state.matrixScenarios.some((item) => item.status === "Locked");
      const lifecycle = !isLastDuplicate ? "Superseded" as const
        : mappedId ? getActionLifecycle(state, mappedId)
          : compareCurrent ? "Current" as const
            : compareComplete ? "Completed" as const : "Superseded" as const;
      const recommendedAction = recommendedId && recommendation?.id === recommendedId ? recommendation : null;
      const onRecommended = recommendedAction ? () => executeRecommendedAction(recommendedAction, { dispatch, navigate, openArtifact: (artifactId) => dispatch({ type: "OPEN_ARTIFACT", artifactId }) }) : undefined;
      const onAction = recommendedAction ? onRecommended : message.payloadRef === "generate-mix" ? () => dispatch({ type: "GENERATE_MIX_OPTIONS" })
        : message.payloadRef === "compare-mix" ? () => dispatch({ type: "OPEN_ARTIFACT", artifactId: "artifact-mix-draft" })
          : message.payloadRef === "prepare-review" ? () => dispatch({ type: "PREPARE_REVIEW" })
            : message.payloadRef === "publish-review" ? () => dispatch({ type: "PUBLISH_REVIEW" }) : undefined;
      const label = recommendedAction?.label ?? (message.payloadRef === "generate-mix" ? "Build mix options" : message.payloadRef === "compare-mix" ? "Open comparison" : message.payloadRef === "prepare-review" ? "Validate slate" : message.payloadRef === "publish-review" ? "Publish Round 1" : undefined);
      const previewHref = recommendedAction?.command.kind === "navigate" ? recommendedAction.command.to : message.payloadRef === "publish-review" ? `/campaigns/${state.id}/client-preview` : undefined;
      return <NextActionCard key={message.id} message={message} lifecycle={lifecycle} onAction={onAction} actionLabel={label} previewHref={previewHref} />;
    }
    if (message.type === "Progress") {
      const run = state.agent.runs.find((item) => item.id === state.agent.activeRunId);
      const steps = state.agent.steps.filter((item) => item.runId === run?.id && run?.stepIds.includes(item.id));
      const completed = steps.filter((item) => item.status === "Succeeded" || item.status === "Skipped").length;
      return <ProgressCard key={message.id} current={recommendation?.stage ?? "Run complete"} completed={completed} total={steps.length} nextLabel={recommendation?.label ?? null} />;
    }
    return <div className={`chat-message ${message.role.toLowerCase()}`} key={message.id}>{message.text}</div>;
  })}</div>;
}
