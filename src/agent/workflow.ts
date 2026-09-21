import type { AgentWorkspaceState, CampaignArtifact, DecisionRequest, RunStep } from "./model";

const RUN_ID = "run-brief-to-shortlist";
const AT = "2026-09-21T09:00:00+08:00";

const steps: RunStep[] = [
  ["step-read", "ReadSources", "Read 3 client sources"],
  ["step-normalize", "NormalizeBrief", "Normalize 18 brief fields"],
  ["step-conflicts", "DetectConflicts", "Resolve high-impact conflicts"],
  ["step-mix", "BuildMix", "Build and validate creator mix"],
  ["step-source", "SourceCandidates", "Source and qualify candidates"],
  ["step-calibrate", "Calibrate", "Calibrate candidate direction"],
  ["step-publish", "PublishReview", "Prepare and publish client review"],
  ["step-gap", "AssessGap", "Assess client feedback gap"],
  ["step-recover", "RecoverGap", "Recover affected Matrix cells"],
].map(([id, kind, label]) => ({ id, runId: RUN_ID, kind: kind as RunStep["kind"], label, status: "Pending", inputRefs: id === "step-read" || id === "step-normalize" ? ["source-email", "source-excel", "source-meeting"] : [], outputRefs: [], summary: "", error: null, startedAt: null, completedAt: null }));

function decisions(): DecisionRequest[] {
  return [
    {
      id: "decision-launch", runId: RUN_ID, stepId: "step-conflicts", conflictId: "conflict-launch", question: "Which launch window should the campaign use?",
      options: [
        { id: "launch-8", label: "Use 8 weeks", value: "8 weeks · Excel", impact: "Keeps the complete sourcing and content-review window." },
        { id: "launch-6", label: "Use 6 weeks", value: "6 weeks · Meeting", impact: "Compresses sourcing and introduces schedule risk." },
      ],
      evidenceSourceIds: ["source-excel", "source-meeting"], recommendation: "8 weeks · Excel", rationale: "The budget workbook is the only formal source that includes a complete delivery schedule.", status: "Pending", resolution: null, resolvedAt: null,
    },
    {
      id: "decision-sports", runId: RUN_ID, stepId: "step-conflicts", conflictId: "conflict-sports", question: "Should motorcycle and skiing creators enter the current plan?",
      options: [
        { id: "sports-exclude", label: "Keep pending and excluded", value: "Pending; excluded from current plan", impact: "Protects the real-cycling evidence requirement." },
        { id: "sports-include", label: "Include adjacent sports", value: "Include", impact: "Expands reach but weakens cycling-specific proof." },
      ],
      evidenceSourceIds: ["source-email", "source-meeting"], recommendation: "Pending; excluded from current plan", rationale: "The client explicitly requires real cycling content; adjacent sports are not confirmed scope.", status: "Pending", resolution: null, resolvedAt: null,
    },
  ];
}

export function planMaterialRun(agent: AgentWorkspaceState): AgentWorkspaceState {
  if (agent.activeRunId) return agent;
  return {
    ...agent,
    activeRunId: RUN_ID,
    runs: [{ id: RUN_ID, campaignId: "campaign-cycling-camera", goal: "Turn client materials into a review-ready creator shortlist", status: "Planned", currentStepId: "step-read", stepIds: steps.map((step) => step.id), inputArtifactIds: [], outputArtifactIds: [], startedAt: null, completedAt: null }],
    steps: structuredClone(steps),
    messages: [...agent.messages,
      { id: "message-user-materials", runId: RUN_ID, role: "User", type: "Text", text: "Analyze the client email, budget workbook, and kickoff notes for the cycling camera launch.", payloadRef: null, createdAt: AT },
      { id: "message-plan", runId: RUN_ID, role: "Agent", type: "Plan", text: "I will read 3 sources, normalize the Brief, surface high-impact conflicts, and pause before strategy decisions.", payloadRef: RUN_ID, createdAt: AT },
    ],
  };
}

export function startMaterialRun(agent: AgentWorkspaceState): AgentWorkspaceState {
  const run = agent.runs.find((item) => item.id === agent.activeRunId);
  if (!run || run.status !== "Planned") return agent;
  const requests = decisions();
  return {
    ...agent,
    runs: agent.runs.map((item) => item.id === run.id ? { ...item, status: "WaitingForDecision", currentStepId: "step-conflicts", startedAt: AT } : item),
    steps: agent.steps.map((step) => {
      if (step.id === "step-read") return { ...step, status: "Succeeded", summary: "Read Email, Excel, and Meeting Notes", startedAt: AT, completedAt: "2026-09-21T09:03:00+08:00" };
      if (step.id === "step-normalize") return { ...step, status: "Succeeded", summary: "Extracted 18 fields with source lineage", startedAt: "2026-09-21T09:03:00+08:00", completedAt: "2026-09-21T09:06:00+08:00" };
      if (step.id === "step-conflicts") return { ...step, status: "Waiting", summary: "Found 2 high-impact conflicts", startedAt: "2026-09-21T09:06:00+08:00" };
      return step;
    }),
    decisions: requests,
    messages: [...agent.messages,
      { id: "message-run-brief", runId: RUN_ID, role: "Agent", type: "RunGroup", text: "Read 3 sources · extracted 18 fields · found 2 high-impact conflicts", payloadRef: RUN_ID, createdAt: "2026-09-21T09:06:00+08:00" },
      { id: "message-decision-launch", runId: RUN_ID, role: "Agent", type: "Decision", text: requests[0].question, payloadRef: requests[0].id, createdAt: "2026-09-21T09:07:00+08:00" },
    ],
  };
}

export function resolveWorkflowDecision(agent: AgentWorkspaceState, decisionId: string, resolution: string): AgentWorkspaceState {
  const target = agent.decisions.find((item) => item.id === decisionId);
  if (!target || target.status === "Resolved") return agent;
  const updatedDecisions = agent.decisions.map((item) => item.id === decisionId ? { ...item, status: "Resolved" as const, resolution, resolvedAt: "2026-09-21T09:10:00+08:00" } : item);
  const pending = updatedDecisions.find((item) => item.status === "Pending");
  const messages = [...agent.messages, { id: `message-user-${decisionId}`, runId: RUN_ID, role: "User" as const, type: "Text" as const, text: resolution, payloadRef: decisionId, createdAt: "2026-09-21T09:10:00+08:00" }];
  if (pending) messages.push({ id: `message-${pending.id}`, runId: RUN_ID, role: "Agent", type: "Decision", text: pending.question, payloadRef: pending.id, createdAt: "2026-09-21T09:10:30+08:00" });
  return {
    ...agent,
    decisions: updatedDecisions,
    runs: agent.runs.map((run) => run.id === RUN_ID ? { ...run, status: pending ? "WaitingForDecision" : "Running", currentStepId: pending ? "step-conflicts" : "step-mix" } : run),
    steps: agent.steps.map((step) => step.id === "step-conflicts" && !pending ? { ...step, status: "Succeeded", summary: "2 high-impact conflicts resolved", completedAt: "2026-09-21T09:12:00+08:00" } : step),
    messages,
  };
}

export function registerArtifact(agent: AgentWorkspaceState, artifact: CampaignArtifact): AgentWorkspaceState {
  return {
    ...agent,
    artifacts: [...agent.artifacts.filter((item) => item.id !== artifact.id), artifact],
    runs: agent.runs.map((run) => run.id === artifact.sourceRunId ? { ...run, outputArtifactIds: [...new Set([...run.outputArtifactIds, artifact.id])] } : run),
    messages: [...agent.messages, { id: `message-${artifact.id}`, runId: artifact.sourceRunId, role: "Agent", type: "Artifact", text: artifact.summary, payloadRef: artifact.id, createdAt: artifact.createdAt }],
  };
}

export function selectArtifact(agent: AgentWorkspaceState, artifactId: string | null): AgentWorkspaceState {
  return { ...agent, selectedArtifactId: artifactId };
}

export function markDependentArtifactsStale(agent: AgentWorkspaceState, changedArtifactId: string): AgentWorkspaceState {
  const staleIds = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const artifact of agent.artifacts) {
      if (!staleIds.has(artifact.id) && artifact.parentArtifactIds.some((id) => id === changedArtifactId || staleIds.has(id))) {
        staleIds.add(artifact.id);
        changed = true;
      }
    }
  }
  return { ...agent, artifacts: agent.artifacts.map((artifact) => staleIds.has(artifact.id) ? { ...artifact, status: "Stale" as const } : artifact) };
}
