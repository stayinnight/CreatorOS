import { campaignSeed } from "../data/seed";
import { publishBrief, resolveConflict } from "../domain/brief";
import { evaluateMatrix, lockMatrix, summarizeMatrix } from "../domain/matrix";
import type { CampaignState, MatrixRow } from "../domain/model";
import { generateSearchPackages } from "../domain/search";
import { candidateScore, qualifyCandidate } from "../domain/candidate";
import { assessGap } from "../domain/gap";
import type { CandidateDecision } from "../domain/model";
import { planMaterialRun, registerArtifact, resolveWorkflowDecision, selectArtifact, startMaterialRun } from "../agent/workflow";
import { resolveAgentIntent } from "../agent/intent";
import { answerCampaignFact } from "../agent/facts";
import { continueFromBrief, reviseRunToBriefOnly } from "../agent/runRevision";
import { buildCalibrationBatch, preferenceForReason } from "../agent/calibration";
import { validateReviewRound } from "../domain/review";
import { getRecommendedNextAction } from "../agent/recommendedAction";

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
  | { type: "GENERATE_MIX_OPTIONS" }
  | { type: "START_SOURCING" }
  | { type: "REJECT_CALIBRATION_CANDIDATE"; candidateId: string; reason: string }
  | { type: "APPROVE_CALIBRATION" }
  | { type: "PREPARE_REVIEW" }
  | { type: "APPLY_SEEDED_CLIENT_FEEDBACK" };

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
      const resolution = resolveAgentIntent(action.text, { state, ...action.context });
      const intent = resolution.intent;
      const suffix = state.agent.messages.length + 1;
      const userMessage = { id: `message-user-${suffix}`, runId: state.agent.activeRunId, role: "User" as const, type: "Text" as const, text: action.text, payloadRef: null, createdAt: "2026-09-21T09:15:00+08:00" };
      const next = getRecommendedNextAction(state);
      const nextPayloadRef = next ? `recommended:${next.id}` : null;
      if (intent.type === "ScopeRun") {
        const withUser = { ...state.agent, messages: [...state.agent.messages, userMessage] };
        return { ...state, agent: reviseRunToBriefOnly(withUser) };
      }
      if (intent.type === "ContinuePlan") return { ...state, agent: continueFromBrief({ ...state.agent, messages: [...state.agent.messages, { ...userMessage, createdAt: "2026-09-21T09:20:00+08:00" }] }) };
      if (intent.type === "NextStep" && next) {
        const alreadyShown = state.agent.messages.some((message) => message.type === "NextAction" && message.payloadRef === nextPayloadRef);
        const messages = [...state.agent.messages, userMessage];
        if (!alreadyShown) messages.push({ id: `message-agent-${suffix}`, runId: state.agent.activeRunId, role: "Agent", type: "NextAction", text: `${next.reason} ${next.outcome}`, payloadRef: nextPayloadRef, createdAt: "2026-09-21T09:15:01+08:00" });
        return { ...state, agent: { ...state.agent, messages } };
      }
      if (intent.type === "Status") {
        const run = state.agent.runs.find((item) => item.id === state.agent.activeRunId);
        const runSteps = state.agent.steps.filter((item) => item.runId === run?.id && run?.stepIds.includes(item.id));
        const completed = runSteps.filter((item) => item.status === "Succeeded" || item.status === "Skipped").length;
        return { ...state, agent: { ...state.agent, messages: [...state.agent.messages, userMessage, {
          id: `message-agent-${suffix}`,
          runId: state.agent.activeRunId,
          role: "Agent",
          type: "Progress",
          text: `${completed}/${runSteps.length} steps complete · ${next?.stage ?? "Run complete"}`,
          payloadRef: nextPayloadRef,
          createdAt: "2026-09-21T09:15:01+08:00",
        }] } };
      }
      const candidate = action.context?.candidateId ? state.candidates.find((item) => item.id === action.context!.candidateId) : undefined;
      const searchPackage = candidate ? state.searchPackages.find((item) => item.matrixCellId === candidate.matrixCellId) : undefined;
      const acknowledgement = intent.type === "ExplainCandidate"
          ? candidate && searchPackage
            ? `${candidate.creatorName} 对应 ${candidate.matrixCellId}：${candidate.evidence[0]?.views.toLocaleString() ?? 0} 次可核验${candidate.ridingScenario}骑行播放，证据包含 ${candidate.evidence[0]?.proofPoints.slice(0, 3).join("、") || "缺失"}；资格为 ${qualifyCandidate(candidate, searchPackage).status}，综合匹配分 ${candidateScore(candidate).total.toFixed(1)}，报价 $${candidate.quote.total.toLocaleString()}。`
            : "当前没有可解释的候选人上下文。请从候选人卡片点击 Ask Agent。"
          : intent.type === "FindSimilar"
            ? candidate
              ? `同一 Matrix 单元格中更生活化的备选：${state.candidates.filter((item) => item.id !== candidate.id && item.matrixCellId === candidate.matrixCellId && !state.agent.calibrationFeedback[item.id]).sort((a, b) => candidateScore(b).total - candidateScore(a).total).slice(0, 2).map((item) => `${item.creatorName} (${candidateScore(item).total.toFixed(1)})`).join("、") || "暂无"}。硬约束保持不变。`
              : "请先从候选人卡片选择上下文，再查找相似人选。"
            : intent.type === "CampaignFact"
              ? answerCampaignFact(state, intent.query)?.body ?? "当前没有对应的 Campaign 数据。"
              : `我无法在当前阶段执行这条指令。你可以尝试：${resolution.suggestions.join(" / ")}。`;
      return { ...state, agent: { ...state.agent, messages: [
        ...state.agent.messages,
        userMessage,
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
      const activeRun = agent.runs.find((run) => run.id === agent.activeRunId);
      agent = activeRun?.scope === "BriefOnly"
        ? { ...agent, runs: agent.runs.map((run) => run.id === activeRun.id ? { ...run, status: "Completed" as const, currentStepId: null, completedAt: "2026-09-21T09:12:30+08:00" } : run), messages: [...agent.messages, { id: "message-brief-scope-complete", runId: activeRun.id, role: "Agent", type: "Text", text: "Brief-only Run complete. Brief v1 is published; downstream planning was intentionally skipped.", payloadRef: "artifact-brief-v1", createdAt: "2026-09-21T09:12:30+08:00" }] }
        : { ...agent, messages: [...agent.messages, { id: "message-next-mix", runId: "run-brief-to-shortlist", role: "Agent", type: "NextAction", text: "Brief v1 is ready. Next I can build and compare two creator mix options.", payloadRef: "generate-mix", createdAt: "2026-09-21T09:12:30+08:00" }] };
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
    case "START_SOURCING": {
      const packages = state.searchPackages.length ? state.searchPackages : generateSearchPackages(state.matrixScenarios.find((scenario) => scenario.id === state.activeScenarioId)!);
      const packageByCell = new Map(packages.map((item) => [item.matrixCellId, item]));
      const calibrationIds = buildCalibrationBatch(state.candidates, packageByCell).map((candidate) => candidate.id);
      let agent = registerArtifact(state.agent, { id: "artifact-calibration-batch-01", campaignId: state.id, kind: "CandidateBatch", version: 1, status: "Ready", sourceRunId: "run-brief-to-shortlist", sourceStepId: "step-source", parentArtifactIds: ["artifact-search-packages-v1"], domainRef: "calibration-batch-01", summary: "Calibration batch ready · 8 qualified examples + 2 explicit failure cases", createdAt: "2026-09-21T09:48:00+08:00" });
      agent = { ...agent, calibrationCandidateIds: calibrationIds, selectedArtifactId: "artifact-calibration-batch-01", steps: agent.steps.map((step) => step.id === "step-source" ? { ...step, status: "Succeeded" as const, summary: "42 profiles evaluated; 10-case calibration batch prepared", completedAt: "2026-09-21T09:48:00+08:00" } : step.id === "step-calibrate" ? { ...step, status: "Waiting" as const, startedAt: "2026-09-21T09:48:00+08:00" } : step), runs: agent.runs.map((run) => run.id === agent.activeRunId ? { ...run, status: "WaitingForApproval" as const, currentStepId: "step-calibrate" } : run) };
      return { ...state, searchPackages: packages, candidatesLoaded: true, agent };
    }
    case "REJECT_CALIBRATION_CANDIDATE": {
      const preference = preferenceForReason(action.reason);
      return { ...state, agent: { ...state.agent, calibrationFeedback: { ...state.agent.calibrationFeedback, [action.candidateId]: action.reason }, campaignPreferences: [...new Set([...state.agent.campaignPreferences, preference])], messages: [...state.agent.messages, { id: `message-calibration-${action.candidateId}`, runId: state.agent.activeRunId, role: "Agent", type: "Text", text: `Applied campaign preference: ${preference}. Hard constraints from Brief and Matrix are unchanged.`, payloadRef: action.candidateId, createdAt: "2026-09-21T09:50:00+08:00" }] } };
    }
    case "APPROVE_CALIBRATION": {
      let agent = registerArtifact(state.agent, { id: "artifact-client-slate-v1", campaignId: state.id, kind: "CandidateBatch", version: 1, status: "Ready", sourceRunId: "run-brief-to-shortlist", sourceStepId: "step-calibrate", parentArtifactIds: ["artifact-calibration-batch-01"], domainRef: "client-slate-v1", summary: "Client slate ready · 30 primaries + 10 internal backups", createdAt: "2026-09-21T09:55:00+08:00" });
      agent = { ...agent, selectedArtifactId: "artifact-client-slate-v1", steps: agent.steps.map((step) => step.id === "step-calibrate" ? { ...step, status: "Succeeded" as const, summary: "Calibration direction approved", completedAt: "2026-09-21T09:55:00+08:00" } : step.id === "step-publish" ? { ...step, status: "Pending" as const } : step), runs: agent.runs.map((run) => run.id === agent.activeRunId ? { ...run, status: "Running" as const, currentStepId: "step-publish" } : run), messages: [...agent.messages, { id: "message-next-review", runId: agent.activeRunId, role: "Agent", type: "NextAction", text: "Calibration approved. I can validate the 30 + 10 slate and prepare the client review.", payloadRef: "prepare-review", createdAt: "2026-09-21T09:55:30+08:00" }] };
      return { ...state, agent };
    }
    case "PREPARE_REVIEW": {
      const packageByCell = new Map(state.searchPackages.map((item) => [item.matrixCellId, item]));
      const qualifications = Object.fromEntries(state.candidates.map((candidate) => { const searchPackage = packageByCell.get(candidate.matrixCellId); return [candidate.id, searchPackage ? qualifyCandidate(candidate, searchPackage) : { status: "Needs Review" as const, reasons: ["Search package missing"], risks: [] }]; }));
      const primaries = state.candidates.filter((candidate) => candidate.role === "Primary").slice(0, 30);
      const backups = state.candidates.filter((candidate) => candidate.role === "Backup");
      const validation = validateReviewRound(primaries, backups, qualifications);
      if (!validation.valid) return { ...state, agent: { ...state.agent, messages: [...state.agent.messages, { id: "message-review-validation", runId: state.agent.activeRunId, role: "Agent", type: "Exception", text: validation.errors.join(" · "), payloadRef: "review-validation", createdAt: "2026-09-21T10:00:00+08:00" }] } };
      return { ...state, agent: { ...state.agent, runs: state.agent.runs.map((run) => run.id === state.agent.activeRunId ? { ...run, status: "WaitingForApproval" as const, currentStepId: "step-publish" } : run), steps: state.agent.steps.map((step) => step.id === "step-publish" ? { ...step, status: "Waiting" as const, summary: "30 client candidates validated; 10 backups protected" } : step), messages: [...state.agent.messages, { id: "message-publish-approval", runId: state.agent.activeRunId, role: "Agent", type: "NextAction", text: "30 client candidates are projection-safe; 10 backups remain internal. Preview the client view, then approve publication.", payloadRef: "publish-review", createdAt: "2026-09-21T10:00:00+08:00" }] } };
    }
    case "APPLY_SEEDED_CLIENT_FEEDBACK": {
      if (!state.reviewRound) return state;
      const decisions = Object.fromEntries(state.reviewRound.candidateIds.map((id) => { const candidate = state.candidates.find((item) => item.id === id)!; return [id, candidate.market === "UK" && candidate.ridingScenario === "Urban" ? "Pass" : "Select"]; })) as Record<string, CandidateDecision>;
      const candidates = state.candidates.map((candidate) => decisions[candidate.id] ? { ...candidate, decision: decisions[candidate.id], clientReason: decisions[candidate.id] === "Pass" ? "Scenario fit" : candidate.clientReason } : candidate);
      const reviewed = candidates.filter((candidate) => state.reviewRound!.candidateIds.includes(candidate.id));
      const backups = candidates.filter((candidate) => candidate.role === "Backup");
      const matrix = state.matrixScenarios.find((scenario) => scenario.id === state.activeScenarioId)!;
      const gapAssessment = assessGap(matrix, reviewed, backups);
      let agent = registerArtifact(state.agent, { id: "artifact-gap-round-01", campaignId: state.id, kind: "GapAssessment", version: 1, status: "Ready", sourceRunId: "run-brief-to-shortlist", sourceStepId: "step-gap", parentArtifactIds: ["artifact-review-round-01"], domainRef: gapAssessment.id, summary: `${gapAssessment.missingCells.length} Matrix cell requires local recovery · ${gapAssessment.recommendedAction}`, createdAt: "2026-09-21T10:25:00+08:00" });
      agent = { ...agent, selectedArtifactId: "artifact-gap-round-01", steps: agent.steps.map((step) => step.id === "step-gap" ? { ...step, status: "Succeeded" as const, summary: "Client feedback mapped to Matrix cells", startedAt: "2026-09-21T10:24:00+08:00", completedAt: "2026-09-21T10:25:00+08:00" } : step.id === "step-recover" ? { ...step, status: "Waiting" as const } : step), runs: agent.runs.map((run) => run.id === agent.activeRunId ? { ...run, status: "WaitingForApproval" as const, currentStepId: "step-recover" } : run), messages: [...agent.messages, { id: "message-next-recovery", runId: agent.activeRunId, role: "Agent", type: "NextAction", text: "Client passes created a UK Urban gap. Promote the qualified backup, then replenish only that search package.", payloadRef: "recover-gap", createdAt: "2026-09-21T10:25:30+08:00" }] };
      return { ...state, candidates, reviewRound: { ...state.reviewRound, status: "Submitted", submittedAt: "2026-09-21T10:24:00+08:00" }, gapAssessment, agent };
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
      const reviewRound = { id: "review-round-01", status: "Published" as const, candidateIds: eligiblePrimaries.map((item) => item.id), publishedAt: "2026-09-21T11:00:00+08:00", submittedAt: null };
      let agent = registerArtifact(state.agent, { id: "artifact-review-round-01", campaignId: state.id, kind: "ReviewRound", version: 1, status: "Published", sourceRunId: "run-brief-to-shortlist", sourceStepId: "step-publish", parentArtifactIds: ["artifact-client-slate-v1"], domainRef: reviewRound.id, summary: "Client Review Round 1 published · 30 projection-safe creators", createdAt: "2026-09-21T10:10:00+08:00" });
      agent = { ...agent, selectedArtifactId: "artifact-review-round-01", steps: agent.steps.map((step) => step.id === "step-publish" ? { ...step, status: "Succeeded" as const, completedAt: "2026-09-21T10:10:00+08:00" } : step.id === "step-gap" ? { ...step, status: "Running" as const, startedAt: "2026-09-21T10:10:00+08:00" } : step), runs: agent.runs.map((run) => run.id === agent.activeRunId ? { ...run, status: "Running" as const, currentStepId: "step-gap" } : run) };
      return {
        ...state,
        agent,
        reviewRound,
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
      const agent = { ...state.agent, messages: [...state.agent.messages, { id: `message-promote-${promoted.id}`, runId: state.agent.activeRunId, role: "Agent" as const, type: "Text" as const, text: `${promoted.creatorName} promoted into the affected Matrix cell. The Brief and locked Mix remain unchanged.`, payloadRef: promoted.id, createdAt: "2026-09-21T10:28:00+08:00" }] };
      return {
        ...state,
        agent,
        candidates,
        gapAssessment: { ...state.gapAssessment, missingCells: remainingCells, recommendedAction: remainingCells.length ? "Replenish" : "Replenish", packageId: nextCell ? `pkg-${nextCell.matrixCellId}` : state.gapAssessment.packageId, backupCandidateId: null },
        activity: [...state.activity, activity(`${promoted.creatorName} promoted from backup`) ],
      };
    }
    case "CREATE_REPLENISHMENT": {
      const parent = state.searchPackages.find((item) => item.id === action.packageId);
      if (!parent) return state;
      const replenishment = { ...parent, id: `${parent.id}-replenishment-01`, status: "Ready" as const, parentPackageId: parent.id, dueAt: "2026-10-01" };
      const agent = { ...state.agent, steps: state.agent.steps.map((step) => step.id === "step-recover" ? { ...step, status: "Succeeded" as const, summary: `Replenished ${parent.market} ${parent.ridingScenario} only`, completedAt: "2026-09-21T10:30:00+08:00" } : step), runs: state.agent.runs.map((run) => run.id === state.agent.activeRunId ? { ...run, status: "Completed" as const, currentStepId: null, completedAt: "2026-09-21T10:30:00+08:00" } : run), messages: [...state.agent.messages, { id: "message-run-complete", runId: state.agent.activeRunId, role: "Agent" as const, type: "Text" as const, text: `Local recovery complete for ${parent.market} ${parent.ridingScenario}. Campaign workflow is complete; upstream artifacts were preserved.`, payloadRef: replenishment.id, createdAt: "2026-09-21T10:30:00+08:00" }] };
      return { ...state, agent, searchPackages: [...state.searchPackages, replenishment], activity: [...state.activity, activity(`Replenishment package created · ${parent.market} ${parent.ridingScenario}`)] };
    }
  }
}
