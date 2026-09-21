import { z } from "zod";
import type { CampaignState } from "../domain/model";

const enumValues = <T extends readonly [string, ...string[]]>(values: T) => z.enum(values);
const market = enumValues(["US", "UK"]);
const platform = enumValues(["YouTube", "TikTok", "Instagram"]);
const ridingScenario = enumValues(["Road", "MTB", "Urban"]);
const evidenceScenario = enumValues(["Road", "MTB", "Urban", "Motorcycle", "Skiing"]);
const contentFormat = enumValues(["Long Review", "Short Video", "Reel"]);

const runStepSchema = z.object({
  id: z.string(), runId: z.string(), kind: enumValues(["ReadSources", "NormalizeBrief", "DetectConflicts", "BuildMix", "SourceCandidates", "Calibrate", "PublishReview", "AssessGap", "RecoverGap"]),
  label: z.string(), status: enumValues(["Pending", "Running", "Waiting", "Succeeded", "Failed", "Skipped"]), inputRefs: z.array(z.string()), outputRefs: z.array(z.string()),
  summary: z.string(), error: z.string().nullable(), startedAt: z.string().nullable(), completedAt: z.string().nullable(),
});

const agentSchema = z.object({
  activeRunId: z.string().nullable(), selectedArtifactId: z.string().nullable(), availableSources: z.array(z.string()),
  runs: z.array(z.object({ id: z.string(), campaignId: z.string(), goal: z.string(), scope: enumValues(["FullCampaign", "BriefOnly"]).optional().default("FullCampaign"), continuationOfRunId: z.string().nullable().optional().default(null), status: enumValues(["Planned", "Running", "WaitingForDecision", "WaitingForApproval", "Failed", "Completed"]), currentStepId: z.string().nullable(), stepIds: z.array(z.string()), inputArtifactIds: z.array(z.string()), outputArtifactIds: z.array(z.string()), startedAt: z.string().nullable(), completedAt: z.string().nullable() })),
  steps: z.array(runStepSchema),
  messages: z.array(z.object({ id: z.string(), runId: z.string().nullable(), role: enumValues(["User", "Agent", "System"]), type: enumValues(["Text", "Plan", "RunGroup", "Decision", "Artifact", "Exception", "NextAction"]), text: z.string(), payloadRef: z.string().nullable(), createdAt: z.string() })),
  decisions: z.array(z.object({ id: z.string(), runId: z.string(), stepId: z.string(), conflictId: z.string(), question: z.string(), options: z.array(z.object({ id: z.string(), label: z.string(), value: z.string(), impact: z.string() })), evidenceSourceIds: z.array(z.string()), recommendation: z.string(), rationale: z.string(), status: enumValues(["Pending", "Resolved"]), resolution: z.string().nullable(), resolvedAt: z.string().nullable() })),
  artifacts: z.array(z.object({ id: z.string(), campaignId: z.string(), kind: enumValues(["Brief", "Mix", "SearchPackageSet", "CandidateBatch", "ReviewRound", "GapAssessment"]), version: z.number(), status: enumValues(["Draft", "Ready", "Locked", "Published", "Stale"]), sourceRunId: z.string(), sourceStepId: z.string(), parentArtifactIds: z.array(z.string()), summary: z.string(), domainRef: z.string(), createdAt: z.string() })),
  calibrationCandidateIds: z.array(z.string()), calibrationFeedback: z.record(z.string(), z.string()), campaignPreferences: z.array(z.string()),
});

const matrixRowSchema = z.object({
  id: z.string(), market, platform, ridingScenario, creatorTier: enumValues(["Macro", "Mid", "Micro"]), contentFormat,
  plannedCreators: z.number().int().nonnegative(), postsPerCreator: z.number().int().positive(), medianRelevantViews: z.number().nonnegative(),
  creatorFee: z.number().nonnegative(), rightsCost: z.number().nonnegative(), otherCost: z.number().nonnegative(), searchMultiplier: z.number().int().positive(), note: z.string(),
});

const evidenceSchema = z.object({
  id: z.string(), sourceType: enumValues(["Internal", "Public", "Manual"]), sourceUrl: z.string().url(), platform,
  publishedAt: z.string(), ridingScenario: evidenceScenario, contentFormat, views: z.number().nonnegative(),
  proofPoints: z.array(enumValues(["Real Cycling", "First-person POV", "Stabilization", "Daylight", "Low Light", "Safety Recording", "Hands-free Mounting", "Long-form Explanation"])),
  verifiedAt: z.string(), stale: z.boolean(),
});

const candidateSchema = z.object({
  id: z.string(), creatorName: z.string(), handle: z.string(), market, platform, ridingScenario: evidenceScenario,
  matrixCellId: z.string(), batchId: z.string(), evidence: z.array(evidenceSchema),
  quote: z.object({
    creatorFee: z.number().nonnegative(), total: z.number().nonnegative(), currency: z.literal("USD"), deliverables: z.string(), availability: z.string(),
    paymentTerms: z.string(), validUntil: z.string(), status: enumValues(["Estimated", "Received"]), gmailThreadId: z.string(),
    rights: z.object({ usageType: enumValues(["Organic Repost", "Paid Ads", "Whitelisting"]), territory: enumValues(["US", "UK", "US + UK", "Global"]), durationDays: z.number().int().positive(), exclusivity: z.boolean(), rawFootage: z.boolean(), cost: z.number().nonnegative() }),
  }),
  forecastViews: z.number().nonnegative(),
  scores: z.object({ relevance: z.number(), production: z.number(), stability: z.number(), commercial: z.number(), audience: z.number() }),
  role: enumValues(["Primary", "Backup", "Unassigned"]), decision: enumValues(["Unreviewed", "Select", "Maybe", "Pass"]),
  internalNote: z.string(), historicalPrice: z.number().nonnegative(), clientReason: z.string(), clientComment: z.string(),
});

const campaignStateSchema = z.object({
  id: z.string(), name: z.literal("Cycling Camera Launch · US / UK"),
  brief: z.object({
    id: z.string(), version: z.number().int().nonnegative(), status: enumValues(["Draft", "Published"]), publishedAt: z.string().nullable(),
    product: z.string(), markets: z.array(market), ridingScenarios: z.array(ridingScenario), proofPoints: z.array(z.string()),
    budgetCap: z.number(), viewsTarget: z.number(), cpmTarget: z.number(), minimumLongFormCreators: z.number(), firstReviewCount: z.number(), backupCount: z.number(),
    sources: z.array(z.object({ id: z.string(), type: enumValues(["Email", "Excel", "Meeting Notes"]), title: z.string(), excerpt: z.string() })),
    conflicts: z.array(z.object({ id: z.string(), field: enumValues(["launchWindow", "adjacentSports"]), label: z.string(), options: z.array(z.string()), sourceIds: z.array(z.string()), status: enumValues(["Unresolved", "Resolved"]), resolution: z.string().nullable() })),
  }),
  matrixScenarios: z.array(z.object({ id: z.string(), name: z.string(), strategy: z.string(), briefVersionId: z.string(), version: z.number(), status: enumValues(["Draft", "Locked", "Stale"]), lockedAt: z.string().nullable(), rows: z.array(matrixRowSchema) })),
  activeScenarioId: z.string(), searchPackages: z.array(z.unknown()), batches: z.array(z.object({ id: z.string(), packageIds: z.array(z.string()), sourceType: enumValues(["Internal", "Public", "Manual"]), createdAt: z.string(), resultCount: z.number(), note: z.string() })),
  candidates: z.array(candidateSchema), candidatesLoaded: z.boolean(), reviewRound: z.unknown().nullable(), gapAssessment: z.unknown().nullable(),
  activity: z.array(z.object({ id: z.string(), at: z.string(), kind: z.string(), message: z.string(), status: enumValues(["Success", "Failed", "Info"]) })),
  agent: agentSchema,
});

export function parseCampaignSeed(input: unknown): CampaignState {
  return campaignStateSchema.parse(input) as CampaignState;
}
