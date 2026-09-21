import type { AgentWorkspaceState } from "./model";

const BRIEF_KINDS = new Set(["ReadSources", "NormalizeBrief", "DetectConflicts"]);

export function reviseRunToBriefOnly(agent: AgentWorkspaceState): AgentWorkspaceState {
  const active = agent.runs.find((run) => run.id === agent.activeRunId);
  if (!active || active.scope === "BriefOnly") return agent;
  return {
    ...agent,
    runs: agent.runs.map((run) => run.id === active.id ? { ...run, scope: "BriefOnly", goal: "Generate an approved Brief v1 from 3 client sources" } : run),
    steps: agent.steps.map((step) => step.runId === active.id && !BRIEF_KINDS.has(step.kind) ? { ...step, status: "Skipped" as const, summary: "Removed by Brief-only scope" } : step),
    messages: [...agent.messages, { id: "message-plan-revised-brief", runId: active.id, role: "Agent", type: "Plan", text: "Plan revised: finish Brief v1, then stop. Matrix, sourcing, calibration, review and recovery are skipped in this Run.", payloadRef: active.id, createdAt: "2026-09-21T09:15:01+08:00" }],
  };
}

export function continueFromBrief(agent: AgentWorkspaceState): AgentWorkspaceState {
  const previous = agent.runs.find((run) => run.id === agent.activeRunId);
  if (!previous || previous.scope !== "BriefOnly" || previous.status !== "Completed") return agent;
  const id = "run-mix-to-review";
  if (agent.runs.some((run) => run.id === id)) return { ...agent, activeRunId: id };
  const downstream = agent.steps.filter((step) => !BRIEF_KINDS.has(step.kind)).map((step) => ({ ...step, runId: id, status: step.kind === "BuildMix" ? "Running" as const : "Pending" as const, summary: "", startedAt: step.kind === "BuildMix" ? "2026-09-21T09:20:00+08:00" : null, completedAt: null }));
  return { ...agent, activeRunId: id, steps: [...agent.steps, ...downstream], runs: [...agent.runs, { id, campaignId: previous.campaignId, goal: "Continue from Brief v1 to a review-ready creator shortlist", scope: "FullCampaign", continuationOfRunId: previous.id, status: "Running", currentStepId: "step-mix", stepIds: downstream.map((step) => step.id), inputArtifactIds: ["artifact-brief-v1"], outputArtifactIds: [], startedAt: "2026-09-21T09:20:00+08:00", completedAt: null }], messages: [...agent.messages, { id: "message-plan-continuation", runId: id, role: "Agent", type: "Plan", text: "Continuation plan: build Mix, calibrate candidates, publish client review, and recover local gaps.", payloadRef: id, createdAt: "2026-09-21T09:20:00+08:00" }] };
}
