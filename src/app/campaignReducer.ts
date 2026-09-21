import { campaignSeed } from "../data/seed";
import { publishBrief, resolveConflict } from "../domain/brief";
import { evaluateMatrix, lockMatrix, summarizeMatrix } from "../domain/matrix";
import type { CampaignState, MatrixRow } from "../domain/model";
import { generateSearchPackages } from "../domain/search";
import { qualifyCandidate } from "../domain/candidate";
import { assessGap } from "../domain/gap";
import type { CandidateDecision } from "../domain/model";
import { planMaterialRun, registerArtifact, resolveWorkflowDecision, selectArtifact, startMaterialRun } from "../agent/workflow";
import { parseAgentIntent } from "../agent/intent";

export type CampaignAction =
  | { type: "RESET" }
  | { type: "RESOLVE_CONFLICT"; conflictId: string; resolution: string }
  | { type: "PUBLISH_BRIEF" }
  | { type: "SELECT_SCENARIO"; scenarioId: string }
  | { type: "UPDATE_MATRIX_ROW"; scenarioId: string; row: MatrixRow }
  | { type: "SIMULATE_LONG_FORM_GAP"; scenarioId: string }
  | { type: "RESTORE_SCENARIO"; scenarioId: string }
  | { type: "LOCK_MATRIX"; scenarioId: string }
  | { type: "GENERATE_PACKAGES"; scenarioId: string }
  | { type: "LOAD_BATCHES" }
  | { type: "PUBLISH_REVIEW" }
  | { type: "SET_CLIENT_DECISION"; candidateId: string; decision: CandidateDecision; reason?: string; comment?: string }
  | { type: "SUBMIT_DECISIONS"; decisions: Record<string, CandidateDecision> }
  | { type: "PROMOTE_BACKUP"; candidateId: string }
  | { type: "CREATE_REPLENISHMENT"; packageId: string }
  | { type: "LOAD_DEMO_MATERIALS" }
  | { type: "START_AGENT_RUN" }
  | { type: "RESOLVE_AGENT_DECISION"; decisionId: string; value: string }
  | { type: "OPEN_ARTIFACT"; artifactId: string }
  | { type: "CLOSE_ARTIFACT" }
  | { type: "SEND_AGENT_MESSAGE"; text: string; context?: { candidateId?: string } }
  | { type: "FAIL_AGENT_STEP"; stepId: string; error: string }
  | { type: "RETRY_AGENT_STEP"; stepId: string }
  | { type: "GENERATE_MIX_OPTIONS" };

function activity(message: string) {
  return { id: `activity-${message.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`, at: "2026-09-21T10:00:00+08:00", kind: "Planning", message, status: "Success" as const };
}

export function campaignReducer(state: CampaignState, action: CampaignAction): CampaignState {
  switch (action.type) {
    case "RESET": return structuredClone(campaignSeed);
    case "LOAD_DEMO_MATERIALS": return { ...state, agent: planMaterialRun(state.agent) };
    case "START_AGENT_RUN": return { ...state, agent: startMaterialRun(state.agent) };
    case "OPEN_ARTIFACT": return { ...state, agent: selectArtifact(state.agent, action.artifactId) };
    case "CLOSE_ARTIFACT": return { ...state, agent: selectArtifact(state.agent, null) };
    case "GENERATE_MIX_OPTIONS": return { ...state, agent: {
      ...state.agent,
      artifacts: [...state.agent.artifacts.filter((artifact) => artifact.id !== "artifact-mix-draft"), { id: "artifact-mix-draft", campaignId: state.id, kind: "Mix", version: 0, status: "Draft", sourceRunId: "run-brief-to-shortlist", sourceStepId: "step-mix", parentArtifactIds: ["artifact-brief-v1"], domainRef: state.activeScenarioId, summary: "Two creator mix options ready to compare", createdAt: "2026-09-21T09:20:00+08:00" }],
      steps: state.agent.steps.map((step) => step.id === "step-mix" ? { ...step, status: "Running" as const, startedAt: "2026-09-21T09:13:00+08:00", summary: "Built two constraint-aware options" } : step),
      runs: state.agent.runs.map((run) => run.id === state.agent.activeRunId ? { ...run, status: "WaitingForApproval" as const, currentStepId: "step-mix" } : run),
      messages: [...state.agent.messages, { id: "message-compare-mix", runId: state.agent.activeRunId, role: "Agent", type: "NextAction", text: "I built two creator mix options. Compare the trade-offs, inspect the Matrix, then lock one direction.", payloadRef: "compare-mix", createdAt: "2026-09-21T09:20:00+08:00" }],
    } };
    case "SEND_AGENT_MESSAGE": {
      const intent = parseAgentIntent(action.text, action.context);
      const suffix = state.agent.messages.length + 1;
      const acknowledgement = intent.type === "ScopeRun"
        ? "明白。本次先完成 Brief 整理；Matrix 和候选人工作会保持待办，不会自动推进。"
        : intent.type === "ExplainCandidate"
          ? "我会基于可核验骑行内容、场景匹配度、制作能力和商业条件解释推荐原因。"
          : intent.type === "FindSimilar"
            ? "我会保留当前候选人的场景与平台约束，并提高生活化内容偏好。"
            : `This deterministic demo can handle the suggested campaign actions; it does not call a general-purpose model. Try: ${intent.suggestions.join(" / ")}.`;
      return { ...state, agent: { ...state.agent, messages: [
        ...state.agent.messages,
        { id: `message-user-${suffix}`, runId: state.agent.activeRunId, role: "User", type: "Text", text: action.text, payloadRef: null, createdAt: "2026-09-21T09:15:00+08:00" },
        { id: `message-agent-${suffix}`, runId: state.agent.activeRunId, role: "Agent", type: "Text", text: acknowledgement, payloadRef: null, createdAt: "2026-09-21T09:15:01+08:00" },
      ] } };
    }
    case "FAIL_AGENT_STEP": {
      const step = state.agent.steps.find((item) => item.id === action.stepId);
      if (!step) return state;
      return { ...state, agent: {
        ...state.agent,
        steps: state.agent.steps.map((item) => item.id === action.stepId ? { ...item, status: "Failed" as const, error: action.error } : item),
        runs: state.agent.runs.map((run) => run.id === step.runId ? { ...run, status: "Failed" as const, currentStepId: action.stepId } : run),
        messages: [...state.agent.messages, { id: `message-exception-${action.stepId}`, runId: step.runId, role: "Agent", type: "Exception", text: action.error, payloadRef: action.stepId, createdAt: "2026-09-21T09:16:00+08:00" }],
      } };
    }
    case "RETRY_AGENT_STEP": {
      const step = state.agent.steps.find((item) => item.id === action.stepId);
      if (!step || step.status !== "Failed") return state;
      return { ...state, agent: {
        ...state.agent,
        steps: state.agent.steps.map((item) => item.id === action.stepId ? { ...item, status: "Running" as const, error: null, startedAt: "2026-09-21T09:17:00+08:00" } : item),
        runs: state.agent.runs.map((run) => run.id === step.runId ? { ...run, status: "Running" as const, currentStepId: action.stepId } : run),
        messages: [...state.agent.messages, { id: `message-retry-${action.stepId}`, runId: step.runId, role: "Agent", type: "RunGroup", text: `Retrying ${step.label}`, payloadRef: step.runId, createdAt: "2026-09-21T09:17:00+08:00" }],
      } };
    }
    case "RESOLVE_AGENT_DECISION": {
      const decision = state.agent.decisions.find((item) => item.id === action.decisionId);
      if (!decision) return state;
      const brief = resolveConflict(state.brief, decision.conflictId, action.value);
      let agent = resolveWorkflowDecision(state.agent, action.decisionId, action.value);
      if (agent.decisions.some((item) => item.status === "Pending")) return { ...state, brief, agent };
      const published = publishBrief(brief);
      agent = registerArtifact(agent, { id: "artifact-brief-v1", campaignId: state.id, kind: "Brief", version: 1, status: "Published", sourceRunId: "run-brief-to-shortlist", sourceStepId: "step-conflicts", parentArtifactIds: [], summary: "Brief v1 published · 2 conflicts resolved · US / UK cycling camera launch", domainRef: "brief-v1", createdAt: "2026-09-21T09:12:00+08:00" });
      agent = { ...agent, messages: [...agent.messages, { id: "message-next-mix", runId: "run-brief-to-shortlist", role: "Agent", type: "NextAction", text: "Brief v1 is ready. Next I can build and compare two creator mix options.", payloadRef: "generate-mix", createdAt: "2026-09-21T09:12:30+08:00" }] };
      return { ...state, brief: published, agent, activity: [...state.activity, activity("Brief v1 published")] };
    }
    case "RESOLVE_CONFLICT": return { ...state, brief: resolveConflict(state.brief, action.conflictId, action.resolution) };
    case "PUBLISH_BRIEF": return { ...state, brief: publishBrief(state.brief), activity: [...state.activity, activity("Brief v1 published")] };
    case "SELECT_SCENARIO": return { ...state, activeScenarioId: action.scenarioId };
    case "UPDATE_MATRIX_ROW": return {
      ...state,
      matrixScenarios: state.matrixScenarios.map((scenario) => scenario.id === action.scenarioId
        ? { ...scenario, rows: scenario.rows.map((row) => row.id === action.row.id ? action.row : row) }
        : scenario),
    };
    case "SIMULATE_LONG_FORM_GAP": return {
      ...state,
      matrixScenarios: state.matrixScenarios.map((scenario) => scenario.id === action.scenarioId
        ? { ...scenario, rows: scenario.rows.map((row) => row.id === "us-mtb-youtube" || row.market === "UK" ? { ...row, plannedCreators: 0 } : row) }
        : scenario),
    };
    case "RESTORE_SCENARIO": {
      const original = campaignSeed.matrixScenarios.find((scenario) => scenario.id === action.scenarioId)!;
      return { ...state, matrixScenarios: state.matrixScenarios.map((scenario) => scenario.id === action.scenarioId ? structuredClone(original) : scenario) };
    }
    case "LOCK_MATRIX": {
      const target = state.matrixScenarios.find((scenario) => scenario.id === action.scenarioId)!;
      const failures = evaluateMatrix(target.rows, state.brief).filter((item) => item.status === "fail");
      if (failures.length) return { ...state, agent: { ...state.agent, messages: [...state.agent.messages, { id: `message-matrix-failure-${state.agent.messages.length}`, runId: state.agent.activeRunId, role: "Agent", type: "Exception", text: `Matrix cannot be locked: ${failures.map((item) => item.label).join(", ")}. Restore or edit the affected cells.`, payloadRef: "matrix-constraint-failure", createdAt: "2026-09-21T09:30:00+08:00" }] } };
      const locked = lockMatrix(target, state.brief);
      const summary = summarizeMatrix(locked.rows);
      let agent = { ...state.agent, artifacts: state.agent.artifacts.filter((artifact) => artifact.id !== "artifact-mix-draft") };
      agent = registerArtifact(agent, { id: "artifact-mix-v1", campaignId: state.id, kind: "Mix", version: locked.version, status: "Locked", sourceRunId: "run-brief-to-shortlist", sourceStepId: "step-mix", parentArtifactIds: ["artifact-brief-v1"], domainRef: locked.id, summary: `Creator Mix v${locked.version} locked · $${Math.round(summary.totalCost / 1000)}K · ${(summary.totalExpectedViews / 1_000_000).toFixed(2)}M views · ${summary.longFormCreators} long-form creators`, createdAt: "2026-09-21T09:35:00+08:00" });
      agent = { ...agent, selectedArtifactId: "artifact-mix-v1" };
      return { ...state, agent, matrixScenarios: state.matrixScenarios.map((scenario) => scenario.id === locked.id ? locked : scenario), activity: [...state.activity, activity(`${locked.name} Matrix v${locked.version} locked`)] };
    }
    case "GENERATE_PACKAGES": {
      const target = state.matrixScenarios.find((scenario) => scenario.id === action.scenarioId)!;
      const packages = generateSearchPackages(target);
      let agent = registerArtifact(state.agent, { id: "artifact-search-packages-v1", campaignId: state.id, kind: "SearchPackageSet", version: 1, status: "Ready", sourceRunId: "run-brief-to-shortlist", sourceStepId: "step-mix", parentArtifactIds: ["artifact-mix-v1"], domainRef: "search-packages-v1", summary: `${packages.length} bounded search packages ready from locked Matrix`, createdAt: "2026-09-21T09:38:00+08:00" });
      agent = { ...agent,
        steps: agent.steps.map((step) => step.id === "step-mix" ? { ...step, status: "Succeeded" as const, completedAt: "2026-09-21T09:38:00+08:00" } : step.id === "step-source" ? { ...step, status: "Running" as const, startedAt: "2026-09-21T09:38:00+08:00" } : step),
        runs: agent.runs.map((run) => run.id === agent.activeRunId ? { ...run, status: "Running" as const, currentStepId: "step-source" } : run),
        messages: [...agent.messages, { id: "message-run-search-packages", runId: agent.activeRunId, role: "Agent", type: "RunGroup", text: `${packages.length} search packages generated from the locked Matrix`, payloadRef: agent.activeRunId, createdAt: "2026-09-21T09:38:30+08:00" }],
      };
      return { ...state, agent, searchPackages: packages, activity: [...state.activity, activity(`${packages.length} search packages generated`)] };
    }
    case "LOAD_BATCHES": return {
      ...state,
      candidatesLoaded: true,
      batches: state.batches.map((batch) => ({ ...batch, packageIds: state.searchPackages.map((item) => item.id) })),
      activity: [...state.activity, activity("2 candidate batches loaded · 42 profiles evaluated")],
    };
    case "PUBLISH_REVIEW": {
      const packageByCell = new Map(state.searchPackages.map((item) => [item.matrixCellId, item]));
      const eligiblePrimaries = state.candidates.filter((candidate) => {
        const searchPackage = packageByCell.get(candidate.matrixCellId);
        return candidate.role === "Primary" && searchPackage && qualifyCandidate(candidate, searchPackage).status === "Qualified";
      });
      if (!state.candidatesLoaded || eligiblePrimaries.length !== state.brief.firstReviewCount) return state;
      return {
        ...state,
        reviewRound: { id: "review-round-01", status: "Published", candidateIds: eligiblePrimaries.map((item) => item.id), publishedAt: "2026-09-21T11:00:00+08:00", submittedAt: null },
        activity: [...state.activity, activity("Client Review Round 1 published · 30 creators")],
      };
    }
    case "SET_CLIENT_DECISION": return {
      ...state,
      candidates: state.candidates.map((candidate) => candidate.id === action.candidateId ? { ...candidate, decision: action.decision, clientReason: action.reason ?? candidate.clientReason, clientComment: action.comment ?? candidate.clientComment } : candidate),
    };
    case "SUBMIT_DECISIONS": {
      if (!state.reviewRound) return state;
      const candidates = state.candidates.map((candidate) => action.decisions[candidate.id] ? {
        ...candidate,
        decision: action.decisions[candidate.id],
        clientReason: action.decisions[candidate.id] === "Pass" ? "Scenario fit" : candidate.clientReason,
      } : candidate);
      const reviewed = candidates.filter((candidate) => state.reviewRound!.candidateIds.includes(candidate.id));
      const backups = candidates.filter((candidate) => candidate.role === "Backup");
      const matrix = state.matrixScenarios.find((scenario) => scenario.id === state.activeScenarioId)!;
      return {
        ...state,
        candidates,
        reviewRound: { ...state.reviewRound, status: "Submitted", submittedAt: "2026-09-21T11:30:00+08:00" },
        gapAssessment: assessGap(matrix, reviewed, backups),
        activity: [...state.activity, activity("Client decisions submitted · coverage gap detected")],
      };
    }
    case "PROMOTE_BACKUP": {
      if (!state.gapAssessment) return state;
      const promoted = state.candidates.find((candidate) => candidate.id === action.candidateId);
      if (!promoted) return state;
      const candidates = state.candidates.map((candidate) => candidate.id === action.candidateId ? { ...candidate, role: "Primary" as const, decision: "Select" as const } : candidate);
      const remainingCells = state.gapAssessment.missingCells.flatMap((cell) => cell.matrixCellId !== promoted.matrixCellId ? [cell] : cell.missingCreators > 1 ? [{ ...cell, missingCreators: cell.missingCreators - 1 }] : []);
      const nextCell = remainingCells[0];
      return {
        ...state,
        candidates,
        gapAssessment: { ...state.gapAssessment, missingCells: remainingCells, recommendedAction: remainingCells.length ? "Replenish" : "Replenish", packageId: nextCell ? `pkg-${nextCell.matrixCellId}` : state.gapAssessment.packageId, backupCandidateId: null },
        activity: [...state.activity, activity(`${promoted.creatorName} promoted from backup`) ],
      };
    }
    case "CREATE_REPLENISHMENT": {
      const parent = state.searchPackages.find((item) => item.id === action.packageId);
      if (!parent) return state;
      const replenishment = { ...parent, id: `${parent.id}-replenishment-01`, status: "Ready" as const, parentPackageId: parent.id, dueAt: "2026-10-01" };
      return { ...state, searchPackages: [...state.searchPackages, replenishment], activity: [...state.activity, activity(`Replenishment package created · ${parent.market} ${parent.ridingScenario}`)] };
    }
  }
}
