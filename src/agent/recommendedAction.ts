import type { CampaignAction } from "../app/campaignReducer";
import { evaluateMatrix } from "../domain/matrix";
import type { CampaignState } from "../domain/model";

export type RecommendedActionId =
  | "resolve-brief"
  | "build-mix"
  | "review-matrix"
  | "lock-matrix"
  | "generate-packages"
  | "start-calibration"
  | "review-calibration"
  | "validate-slate"
  | "preview-client"
  | "recover-gap"
  | "view-result";

export interface RecommendedAction {
  id: RecommendedActionId;
  stage: string;
  title: string;
  reason: string;
  outcome: string;
  label: string;
  command:
    | { kind: "dispatch"; action: CampaignAction }
    | { kind: "open"; artifactId: string }
    | { kind: "navigate"; to: string }
    | { kind: "focus"; targetId: string };
}

export type ActionLifecycle = "Current" | "Completed" | "Superseded";

function recommendation(
  id: RecommendedActionId,
  stage: string,
  title: string,
  reason: string,
  outcome: string,
  label: string,
  command: RecommendedAction["command"],
): RecommendedAction {
  return { id, stage, title, reason, outcome, label, command };
}

export function getRecommendedNextAction(state: CampaignState): RecommendedAction | null {
  if (!state.agent.activeRunId && state.agent.artifacts.length === 0) return null;

  const pendingDecision = state.agent.decisions.find((item) => item.status === "Pending");
  if (pendingDecision) {
    return recommendation(
      "resolve-brief",
      "Brief decision",
      "Resolve the open Brief decision",
      "A high-impact conflict still needs your choice.",
      "Publishes a source-linked Brief after all decisions are resolved.",
      "Review decision",
      { kind: "focus", targetId: `decision-${pendingDecision.id}` },
    );
  }

  const mixArtifact = state.agent.artifacts.find((item) => item.kind === "Mix");
  if (!mixArtifact) {
    return recommendation(
      "build-mix",
      "Brief ready",
      "Build two creator mix options",
      "The Brief is published and ready for planning.",
      "Creates two constraint-aware Matrix options.",
      "Build mix options",
      { kind: "dispatch", action: { type: "GENERATE_MIX_OPTIONS" } },
    );
  }

  const scenario = state.matrixScenarios.find((item) => item.id === state.activeScenarioId) ?? state.matrixScenarios[0];
  const failures = evaluateMatrix(scenario.rows, state.brief).filter((item) => item.status === "fail");
  if (scenario.status !== "Locked") {
    return failures.length
      ? recommendation(
        "review-matrix",
        "Matrix blocked",
        "Review failing Matrix cells",
        `${failures.length} constraint checks are failing.`,
        "Fixes the allocation before it becomes a sourcing contract.",
        "Review constraints",
        { kind: "focus", targetId: "matrix-review" },
      )
      : recommendation(
        "lock-matrix",
        "Mix ready",
        "Lock the selected Matrix",
        "All hard constraints are passing.",
        "Creates Mix v1 and freezes the sourcing allocation.",
        "Lock Matrix",
        { kind: "dispatch", action: { type: "LOCK_MATRIX", scenarioId: scenario.id } },
      );
  }

  if (!state.searchPackages.length) {
    return recommendation(
      "generate-packages",
      "Matrix locked",
      "Generate bounded search packages",
      "The approved mix is now the sourcing contract.",
      "Creates six packages and unlocks calibration.",
      "Generate search packages",
      { kind: "dispatch", action: { type: "GENERATE_PACKAGES", scenarioId: scenario.id } },
    );
  }

  const calibration = state.agent.artifacts.find((item) => item.domainRef === "calibration-batch-01");
  if (!calibration) {
    return recommendation(
      "start-calibration",
      "Packages ready",
      "Start the 10-person calibration",
      "The bounded searches are ready for a quality sample.",
      "Builds eight qualified examples and two visible failure cases.",
      "Start calibration",
      { kind: "dispatch", action: { type: "START_SOURCING" } },
    );
  }

  const calibrateStep = state.agent.steps.find((item) => item.kind === "Calibrate");
  if (calibrateStep?.status === "Waiting") {
    return recommendation(
      "review-calibration",
      "Calibration waiting",
      "Review the calibration batch",
      "The Agent needs your quality direction before scaling.",
      "Applies your feedback before the 30 + 10 slate is prepared.",
      "Review calibration",
      { kind: "open", artifactId: calibration.id },
    );
  }

  const publishStep = state.agent.steps.find((item) => item.kind === "PublishReview");
  if (!state.reviewRound && publishStep?.status !== "Waiting") {
    return recommendation(
      "validate-slate",
      "Direction approved",
      "Validate the 30 + 10 slate",
      "Calibration is approved.",
      "Checks projection safety and protects ten internal backups.",
      "Validate slate",
      { kind: "dispatch", action: { type: "PREPARE_REVIEW" } },
    );
  }

  if (!state.reviewRound || state.reviewRound.status === "Draft") {
    return recommendation(
      "preview-client",
      "Slate ready",
      "Preview the client view",
      "The slate is projection-safe.",
      "Lets you inspect the client-safe view before publication.",
      "Preview client view",
      { kind: "navigate", to: `/campaigns/${state.id}/client-preview` },
    );
  }

  const gap = state.agent.artifacts.find((item) => item.kind === "GapAssessment");
  if (gap) {
    return recommendation(
      "recover-gap",
      "Local gap found",
      "Recover the affected Matrix cell",
      "Client feedback created a bounded coverage gap.",
      "Promotes a backup or replenishes only the affected package.",
      "Open gap recovery",
      { kind: "open", artifactId: gap.id },
    );
  }

  const result = [...state.agent.artifacts].reverse().find((item) => item.status !== "Stale");
  return result
    ? recommendation(
      "view-result",
      "Run complete",
      "View the latest result",
      "The current run has no pending approval.",
      "Opens the latest retained artifact.",
      "View result",
      { kind: "open", artifactId: result.id },
    )
    : null;
}

export function getActionLifecycle(state: CampaignState, id: RecommendedActionId): ActionLifecycle {
  if (getRecommendedNextAction(state)?.id === id) return "Current";
  const completed: Partial<Record<RecommendedActionId, boolean>> = {
    "resolve-brief": state.agent.decisions.length > 0 && state.agent.decisions.every((item) => item.status === "Resolved"),
    "build-mix": state.agent.artifacts.some((item) => item.kind === "Mix"),
    "lock-matrix": state.matrixScenarios.some((item) => item.status === "Locked"),
    "generate-packages": state.searchPackages.length > 0,
    "start-calibration": state.agent.artifacts.some((item) => item.domainRef === "calibration-batch-01"),
    "review-calibration": state.agent.steps.some((item) => item.kind === "Calibrate" && item.status === "Succeeded"),
    "validate-slate": state.agent.steps.some((item) => item.kind === "PublishReview" && item.status === "Waiting"),
    "preview-client": Boolean(state.reviewRound),
    "recover-gap": state.agent.steps.some((item) => item.kind === "RecoverGap" && item.status === "Succeeded"),
  };
  return completed[id] ? "Completed" : "Superseded";
}
