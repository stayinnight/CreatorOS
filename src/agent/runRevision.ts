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
