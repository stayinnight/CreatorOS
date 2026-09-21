import type { AgentWorkspaceState } from "./model";

export function createAgentSeed(): AgentWorkspaceState {
  return {
    activeRunId: null,
    selectedArtifactId: null,
    availableSources: ["source-email", "source-excel", "source-meeting"],
    runs: [],
    steps: [],
    decisions: [],
    artifacts: [],
    calibrationCandidateIds: [],
    calibrationFeedback: {},
    campaignPreferences: [],
    calibrationReviews: [],
    calibrationPreferences: [],
    calibrationPreferenceConfirmed: false,
    calibrationSelectedCandidateId: null,
    approvedPrimaryIds: [],
    approvedBackupIds: [],
    turns: [],
    messages: [{
      id: "message-welcome",
      runId: null,
      role: "Agent",
      type: "Text",
      text: "Give me the client materials. I’ll analyze the email, budget sheet, and meeting notes, then pause at high-impact conflicts.",
      messageKey: "agent.welcome",
      payloadRef: null,
      createdAt: "2026-09-21T08:30:00+08:00",
    }],
  };
}
