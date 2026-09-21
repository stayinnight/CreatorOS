export type AgentRunStatus = "Planned" | "Running" | "WaitingForDecision" | "WaitingForApproval" | "Failed" | "Completed";
export type RunStepStatus = "Pending" | "Running" | "Waiting" | "Succeeded" | "Failed" | "Skipped";
export type AgentMessageType = "Text" | "Plan" | "RunGroup" | "Decision" | "Artifact" | "Exception" | "NextAction" | "Progress";
export type ArtifactKind = "Brief" | "Mix" | "SearchPackageSet" | "CandidateBatch" | "ReviewRound" | "GapAssessment";
export type ArtifactStatus = "Draft" | "Ready" | "Locked" | "Published" | "Stale";

export interface RunStep {
  id: string;
  runId: string;
  kind: "ReadSources" | "NormalizeBrief" | "DetectConflicts" | "BuildMix" | "SourceCandidates" | "Calibrate" | "PublishReview" | "AssessGap" | "RecoverGap";
  label: string;
  status: RunStepStatus;
  inputRefs: string[];
  outputRefs: string[];
  summary: string;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface AgentRun {
  id: string;
  campaignId: string;
  goal: string;
  scope: "FullCampaign" | "BriefOnly";
  continuationOfRunId: string | null;
  status: AgentRunStatus;
  currentStepId: string | null;
  stepIds: string[];
  inputArtifactIds: string[];
  outputArtifactIds: string[];
  startedAt: string | null;
  completedAt: string | null;
}

export interface AgentMessage {
  id: string;
  runId: string | null;
  role: "User" | "Agent" | "System";
  type: AgentMessageType;
  text: string;
  payloadRef: string | null;
  createdAt: string;
}

export interface DecisionOption {
  id: string;
  label: string;
  value: string;
  impact: string;
}

export interface DecisionRequest {
  id: string;
  runId: string;
  stepId: string;
  conflictId: string;
  question: string;
  options: DecisionOption[];
  evidenceSourceIds: string[];
  recommendation: string;
  rationale: string;
  status: "Pending" | "Resolved";
  resolution: string | null;
  resolvedAt: string | null;
}

export interface CampaignArtifact {
  id: string;
  campaignId: string;
  kind: ArtifactKind;
  version: number;
  status: ArtifactStatus;
  sourceRunId: string;
  sourceStepId: string;
  parentArtifactIds: string[];
  summary: string;
  domainRef: string;
  createdAt: string;
}

export type CalibrationDecision = "Accepted" | "Rejected" | "NeedsFollowUp";
export type RejectReason = "No real cycling" | "Too commercial" | "Not enough POV evidence" | "Audience mismatch" | "Quote too high";

export interface CalibrationReview {
  candidateId: string;
  decision: CalibrationDecision;
  reason: RejectReason | null;
  reviewedAt: string;
}

export interface CampaignPreference {
  id: string;
  label: string;
  strength: number;
  affectedCandidateIds: string[];
}

export interface PreferenceImpact extends CampaignPreference {
  kind: "SoftPreference" | "QualificationCorrection";
  candidateId: string;
  reason: RejectReason;
}

export type AgentToolKind = "ReadMatrixCell" | "EvaluateQualification" | "InspectEvidence" | "SummarizeFit" | "ReadQuote" | "CompareBudgetCeiling" | "ApplyCampaignPreferences" | "ReadWorkflowState";
export interface AgentToolStepRecord { id: string; kind: AgentToolKind; label: string; inputRefs: string[]; summary: string; }
export interface AgentTurnRecord { id: string; query: string; status: "Completed" | "Failed"; understanding: string; steps: AgentToolStepRecord[]; ruleIds: string[]; evidenceIds: string[]; answerMessageId: string | null; error: string | null; }

export interface AgentWorkspaceState {
  activeRunId: string | null;
  selectedArtifactId: string | null;
  availableSources: string[];
  runs: AgentRun[];
  steps: RunStep[];
  messages: AgentMessage[];
  decisions: DecisionRequest[];
  artifacts: CampaignArtifact[];
  calibrationCandidateIds: string[];
  calibrationFeedback: Record<string, string>;
  campaignPreferences: string[];
  calibrationReviews: CalibrationReview[];
  calibrationPreferences: CampaignPreference[];
  calibrationPreferenceConfirmed: boolean;
  calibrationSelectedCandidateId: string | null;
  approvedPrimaryIds: string[];
  approvedBackupIds: string[];
  turns: AgentTurnRecord[];
}
