export type Market = "US" | "UK";
export type Platform = "YouTube" | "TikTok" | "Instagram";
export type RidingScenario = "Road" | "MTB" | "Urban";
export type EvidenceScenario = RidingScenario | "Motorcycle" | "Skiing";
export type CandidateDecision = "Unreviewed" | "Select" | "Maybe" | "Pass";
export type CandidateRole = "Primary" | "Backup" | "Unassigned";
export type QualificationStatus = "Qualified" | "Needs Review" | "Disqualified";

export type ProofPoint =
  | "Real Cycling"
  | "First-person POV"
  | "Stabilization"
  | "Daylight"
  | "Low Light"
  | "Safety Recording"
  | "Hands-free Mounting"
  | "Long-form Explanation";

export interface BriefSource {
  id: string;
  type: "Email" | "Excel" | "Meeting Notes";
  title: string;
  excerpt: string;
}

export interface BriefConflict {
  id: string;
  field: "launchWindow" | "adjacentSports";
  label: string;
  options: string[];
  sourceIds: string[];
  status: "Unresolved" | "Resolved";
  resolution: string | null;
}

export interface BriefVersion {
  id: string;
  version: number;
  status: "Draft" | "Published";
  publishedAt: string | null;
  product: string;
  markets: Market[];
  ridingScenarios: RidingScenario[];
  proofPoints: string[];
  budgetCap: number;
  viewsTarget: number;
  cpmTarget: number;
  minimumLongFormCreators: number;
  firstReviewCount: number;
  backupCount: number;
  sources: BriefSource[];
  conflicts: BriefConflict[];
}

export interface MatrixRow {
  id: string;
  market: Market;
  platform: Platform;
  ridingScenario: RidingScenario;
  creatorTier: "Macro" | "Mid" | "Micro";
  contentFormat: "Long Review" | "Short Video" | "Reel";
  plannedCreators: number;
  postsPerCreator: number;
  medianRelevantViews: number;
  creatorFee: number;
  rightsCost: number;
  otherCost: number;
  searchMultiplier: number;
  note: string;
}

export interface MatrixScenario {
  id: string;
  name: string;
  strategy: string;
  briefVersionId: string;
  version: number;
  status: "Draft" | "Locked" | "Stale";
  lockedAt: string | null;
  rows: MatrixRow[];
}

export interface RightsTerms {
  usageType: "Organic Repost" | "Paid Ads" | "Whitelisting";
  territory: "US" | "UK" | "US + UK" | "Global";
  durationDays: number;
  exclusivity: boolean;
  rawFootage: boolean;
  cost: number;
}

export interface Quote {
  creatorFee: number;
  total: number;
  currency: "USD";
  deliverables: string;
  availability: string;
  paymentTerms: string;
  validUntil: string;
  status: "Estimated" | "Received";
  gmailThreadId: string;
  rights: RightsTerms;
}

export interface Evidence {
  id: string;
  sourceType: "Internal" | "Public" | "Manual";
  sourceUrl: string;
  platform: Platform;
  publishedAt: string;
  ridingScenario: EvidenceScenario;
  contentFormat: "Long Review" | "Short Video" | "Reel";
  views: number;
  proofPoints: ProofPoint[];
  verifiedAt: string;
  stale: boolean;
}

export interface CandidateScores {
  relevance: number;
  production: number;
  stability: number;
  commercial: number;
  audience: number;
}

export interface CampaignCandidate {
  id: string;
  creatorName: string;
  handle: string;
  market: Market;
  platform: Platform;
  ridingScenario: EvidenceScenario;
  matrixCellId: string;
  batchId: string;
  evidence: Evidence[];
  quote: Quote;
  forecastViews: number;
  scores: CandidateScores;
  role: CandidateRole;
  decision: CandidateDecision;
  internalNote: string;
  historicalPrice: number;
  clientReason: string;
  clientComment: string;
}

export interface SearchPackage {
  id: string;
  campaignId: string;
  briefVersionId: string;
  matrixVersionId: string;
  matrixCellId: string;
  market: Market;
  platform: Platform;
  ridingScenario: RidingScenario;
  creatorTier: MatrixRow["creatorTier"];
  contentFormat: MatrixRow["contentFormat"];
  targetCreatorCount: number;
  candidateTargetCount: number;
  backupTargetCount: number;
  budgetCeilingPerCreator: number;
  expectedViewsFloor: number;
  rightsRequirements: string;
  mustHaveRules: string[];
  exclusionRules: string[];
  evidenceRequirements: string[];
  owner: string;
  dueAt: string;
  status: "Draft" | "Ready" | "Searching" | "Reviewing" | "Enough" | "Gap" | "Closed";
  parentPackageId: string | null;
}

export interface CandidateBatch {
  id: string;
  packageIds: string[];
  sourceType: "Internal" | "Public" | "Manual";
  createdAt: string;
  resultCount: number;
  note: string;
}

export interface ClientCandidate {
  id: string;
  creatorName: string;
  handle: string;
  market: Market;
  platform: Platform;
  ridingScenario: EvidenceScenario;
  forecastViews: number;
  deliverables: string;
  quoteRange: string;
  rightsSummary: string;
  evidence: Evidence[];
  decision: CandidateDecision;
  clientReason: string;
  clientComment: string;
}

export interface ReviewRound {
  id: string;
  status: "Draft" | "Published" | "Submitted";
  candidateIds: string[];
  publishedAt: string | null;
  submittedAt: string | null;
}

export interface GapCell {
  matrixCellId: string;
  market: Market;
  ridingScenario: RidingScenario;
  missingCreators: number;
  missingViews: number;
}

export interface GapAssessment {
  id: string;
  missingCells: GapCell[];
  remainingBudget: number;
  recommendedAction: "Promote Backup" | "Replenish" | "Replan Matrix" | "Revise Brief";
  packageId: string;
  backupCandidateId: string | null;
}

export interface ActivityItem {
  id: string;
  at: string;
  kind: string;
  message: string;
  status: "Success" | "Failed" | "Info";
}

export interface CampaignState {
  id: string;
  name: "Cycling Camera Launch · US / UK";
  brief: BriefVersion;
  matrixScenarios: MatrixScenario[];
  activeScenarioId: string;
  searchPackages: SearchPackage[];
  batches: CandidateBatch[];
  candidates: CampaignCandidate[];
  candidatesLoaded: boolean;
  reviewRound: ReviewRound | null;
  gapAssessment: GapAssessment | null;
  activity: ActivityItem[];
  agent: AgentWorkspaceState;
}

export interface Qualification {
  status: QualificationStatus;
  reasons: string[];
  risks: string[];
}

export type GateStatus = "Pass" | "Review" | "Fail";
export type EvidenceConfidence = "High" | "Medium" | "Low";
export type QualificationGateId = "market" | "platform-format" | "real-cycling" | "scenario" | "head-camera-proof" | "commercial";

export interface GateResult {
  id: QualificationGateId;
  label: string;
  status: GateStatus;
  ruleId: string;
  evidenceIds: string[];
  summary: string;
}

export interface FitScore {
  total: number;
  weights: { relevance: 30; povEvidence: 25; production: 15; stability: 15; commercial: 10; audience: 5 };
  breakdown: Record<"relevance" | "povEvidence" | "production" | "stability" | "commercial" | "audience", number>;
}

export interface QualificationResult {
  candidateId: string;
  status: QualificationStatus;
  confidence: EvidenceConfidence;
  gates: GateResult[];
  evidenceIds: string[];
  risks: string[];
  score: FitScore | null;
}
import type { AgentWorkspaceState } from "../agent/model";
