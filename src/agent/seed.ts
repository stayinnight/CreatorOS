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
    messages: [{
      id: "message-welcome",
      runId: null,
      role: "Agent",
      type: "Text",
      text: "把客户材料交给我。我会先分析邮件、预算表和会议纪要，再在高影响冲突处暂停。",
      payloadRef: null,
      createdAt: "2026-09-21T08:30:00+08:00",
    }],
  };
}
