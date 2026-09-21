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
import { AgentTurnTrace } from "./AgentTurnTrace";
import { TypewriterAnswer } from "./TypewriterAnswer";
import type { AgentTurnController } from "./useAgentTurn";

const legacyActionIds: Record<string, RecommendedActionId> = {
  "generate-mix": "build-mix",
  "prepare-review": "validate-slate",
  "publish-review": "preview-client",
};

export function AgentTimeline({ onOpenArtifact = (artifactId) => undefined, openingArtifactId = null, turn }: { onOpenArtifact?: (artifactId: string) => void; openingArtifactId?: string | null; turn?: AgentTurnController }) {
  const { state, dispatch } = useCampaign();
  const navigate = useNavigate();
  const perform = (action: Parameters<typeof dispatch>[0]) => turn ? turn.performAction(action) : dispatch(action);
  const recommendation = getRecommendedNextAction(state);
  const lastActionIndex = new Map<string, number>();
  state.agent.messages.forEach((message, index) => { if (message.type === "NextAction" && message.payloadRef) lastActionIndex.set(message.payloadRef, index); });
  return <div className="agent-timeline">{state.agent.messages.map((message, messageIndex) => {
    if (message.type === "Plan") {
      const run = state.agent.runs.find((item) => item.id === message.payloadRef);
      if (!run) return null;
      return <PlanCard key={message.id} run={run} steps={state.agent.steps.filter((step) => step.runId === run.id && run.stepIds.includes(step.id))} onStart={() => perform({ type: "START_AGENT_RUN" })} />;
    }
    if (message.type === "RunGroup") {
      const run = state.agent.runs.find((item) => item.id === message.payloadRef);
      return <RunGroupCard key={message.id} steps={state.agent.steps.filter((step) => step.runId === run?.id && run?.stepIds.includes(step.id)).filter((step) => step.status !== "Pending")} />;
    }
    if (message.type === "Decision") {
      const decision = state.agent.decisions.find((item) => item.id === message.payloadRef);
      if (!decision) return null;
      return <DecisionCard key={message.id} decision={decision} sources={state.brief.sources.filter((source) => decision.evidenceSourceIds.includes(source.id))} onResolve={(value) => perform({ type: "RESOLVE_AGENT_DECISION", decisionId: decision.id, value })} />;
    }
    if (message.type === "Artifact") {
      const artifact = state.agent.artifacts.find((item) => item.id === message.payloadRef);
      if (!artifact) return null;
      return <ArtifactCard key={message.id} artifact={artifact} onOpen={() => onOpenArtifact(artifact.id)} />;
    }
    if (message.type === "Exception") {
      const step = state.agent.steps.find((item) => item.id === message.payloadRef);
      return <ExceptionCard key={message.id} message={message} step={step} onRetry={() => message.payloadRef && perform({ type: "RETRY_AGENT_STEP", stepId: message.payloadRef })} />;
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
      const onRecommended = recommendedAction ? () => executeRecommendedAction(recommendedAction, { dispatch: perform, navigate, openArtifact: onOpenArtifact }) : undefined;
      const onAction = recommendedAction ? onRecommended : message.payloadRef === "generate-mix" ? () => perform({ type: "GENERATE_MIX_OPTIONS" })
        : message.payloadRef === "compare-mix" ? () => onOpenArtifact("artifact-mix-draft")
          : message.payloadRef === "prepare-review" ? () => perform({ type: "PREPARE_REVIEW" })
            : message.payloadRef === "publish-review" ? () => perform({ type: "PUBLISH_REVIEW" }) : undefined;
      const label = recommendedAction?.label ?? (message.payloadRef === "generate-mix" ? "Build mix options" : message.payloadRef === "compare-mix" ? "Open comparison" : message.payloadRef === "prepare-review" ? "Validate slate" : message.payloadRef === "publish-review" ? "Publish Round 1" : undefined);
      const previewHref = recommendedAction?.command.kind === "navigate" ? recommendedAction.command.to : message.payloadRef === "publish-review" ? `/campaigns/${state.id}/client-preview` : undefined;
      const targetArtifactId = recommendedAction?.command.kind === "open" ? recommendedAction.command.artifactId : message.payloadRef === "compare-mix" ? "artifact-mix-draft" : null;
      return <NextActionCard key={message.id} message={message} lifecycle={lifecycle} onAction={onAction} actionLabel={label} previewHref={previewHref} busy={Boolean(targetArtifactId && openingArtifactId === targetArtifactId)} />;
    }
    if (message.type === "Progress") {
      const run = state.agent.runs.find((item) => item.id === state.agent.activeRunId);
      const steps = state.agent.steps.filter((item) => item.runId === run?.id && run?.stepIds.includes(item.id));
      const completed = steps.filter((item) => item.status === "Succeeded" || item.status === "Skipped").length;
      return <ProgressCard key={message.id} current={recommendation?.stage ?? "Run complete"} completed={completed} total={steps.length} nextLabel={recommendation?.label ?? null} />;
    }
    const answerTurn = state.agent.turns.find((item) => item.answerMessageId === message.id);
    return <div className={`chat-message ${message.role.toLowerCase()}`} key={message.id}>{message.role === "Agent" ? <TypewriterAnswer text={message.text} active={Boolean(answerTurn && turn?.revealingTurnId === answerTurn.id)} /> : message.text}</div>;
  })}{turn?.activeTurn && turn.activeTurn.phase !== "Completed" && <AgentTurnTrace phase={turn.activeTurn.phase} understanding={turn.activeTurn.plan.understanding} steps={turn.activeTurn.plan.steps} completedStepCount={turn.activeTurn.completedStepCount} />}{!turn?.activeTurn && state.agent.turns.length > 0 && (() => { const completed = state.agent.turns.at(-1)!; return <AgentTurnTrace phase="Completed" understanding={completed.understanding} steps={completed.steps} completedStepCount={completed.steps.length} />; })()}</div>;
}
