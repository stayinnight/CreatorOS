import { campaignSeed } from "../data/seed";
import { publishBrief, resolveConflict } from "../domain/brief";
import { lockMatrix } from "../domain/matrix";
import type { CampaignState, MatrixRow } from "../domain/model";
import { generateSearchPackages } from "../domain/search";
import { qualifyCandidate } from "../domain/candidate";
import { assessGap } from "../domain/gap";
import type { CandidateDecision } from "../domain/model";
import { planMaterialRun, registerArtifact, resolveWorkflowDecision, selectArtifact, startMaterialRun } from "../agent/workflow";

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
  | { type: "CLOSE_ARTIFACT" };

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
      const locked = lockMatrix(target, state.brief);
      return { ...state, matrixScenarios: state.matrixScenarios.map((scenario) => scenario.id === locked.id ? locked : scenario), activity: [...state.activity, activity(`${locked.name} Matrix v${locked.version} locked`)] };
    }
    case "GENERATE_PACKAGES": {
      const target = state.matrixScenarios.find((scenario) => scenario.id === action.scenarioId)!;
      const packages = generateSearchPackages(target);
      return { ...state, searchPackages: packages, activity: [...state.activity, activity(`${packages.length} search packages generated`)] };
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
