import type { CampaignCandidate, CampaignState, MatrixRow } from "../domain/model";

const scenarioARows: MatrixRow[] = [
  { id: "us-road-youtube", market: "US", platform: "YouTube", ridingScenario: "Road", creatorTier: "Mid", contentFormat: "Long Review", plannedCreators: 2, postsPerCreator: 1, medianRelevantViews: 500_000, creatorFee: 28_000, rightsCost: 4_000, otherCost: 0, searchMultiplier: 3, note: "Hero reviews with POV and safety proof." },
  { id: "us-mtb-youtube", market: "US", platform: "YouTube", ridingScenario: "MTB", creatorTier: "Mid", contentFormat: "Long Review", plannedCreators: 1, postsPerCreator: 1, medianRelevantViews: 400_000, creatorFee: 26_000, rightsCost: 4_000, otherCost: 0, searchMultiplier: 3, note: "Rough-terrain stabilization proof." },
  { id: "uk-urban-youtube", market: "UK", platform: "YouTube", ridingScenario: "Urban", creatorTier: "Mid", contentFormat: "Long Review", plannedCreators: 1, postsPerCreator: 1, medianRelevantViews: 350_000, creatorFee: 24_000, rightsCost: 4_000, otherCost: 0, searchMultiplier: 3, note: "Commuting and low-light credibility." },
  { id: "us-road-tiktok", market: "US", platform: "TikTok", ridingScenario: "Road", creatorTier: "Micro", contentFormat: "Short Video", plannedCreators: 2, postsPerCreator: 1, medianRelevantViews: 180_000, creatorFee: 6_000, rightsCost: 1_000, otherCost: 0, searchMultiplier: 3, note: "Fast POV reach." },
  { id: "us-mtb-tiktok", market: "US", platform: "TikTok", ridingScenario: "MTB", creatorTier: "Micro", contentFormat: "Short Video", plannedCreators: 2, postsPerCreator: 1, medianRelevantViews: 160_000, creatorFee: 6_000, rightsCost: 1_000, otherCost: 0, searchMultiplier: 3, note: "Trail action cut-downs." },
  { id: "uk-urban-instagram", market: "UK", platform: "Instagram", ridingScenario: "Urban", creatorTier: "Micro", contentFormat: "Reel", plannedCreators: 4, postsPerCreator: 1, medianRelevantViews: 80_000, creatorFee: 4_500, rightsCost: 1_000, otherCost: 0, searchMultiplier: 3, note: "Commuter proof and retargetable clips." },
];

const scenarioBRows: MatrixRow[] = [
  { ...scenarioARows[0], plannedCreators: 2, medianRelevantViews: 450_000, creatorFee: 20_000, note: "Efficient mid-tier road reviews." },
  { ...scenarioARows[1], plannedCreators: 1, medianRelevantViews: 350_000, creatorFee: 20_000, note: "Focused MTB proof." },
  { ...scenarioARows[2], plannedCreators: 1, medianRelevantViews: 300_000, creatorFee: 18_000, note: "One UK commuting anchor." },
  { ...scenarioARows[3], plannedCreators: 3, medianRelevantViews: 200_000, creatorFee: 6_500, rightsCost: 1_500, note: "Scaled road reach." },
  { ...scenarioARows[4], plannedCreators: 3, medianRelevantViews: 180_000, creatorFee: 6_500, rightsCost: 1_500, note: "Scaled trail reach." },
  { ...scenarioARows[5], plannedCreators: 5, medianRelevantViews: 112_000, creatorFee: 4_000, note: "Urban reach with cost buffer." },
];

const segmentTemplates = [
  { cell: "us-road-youtube", market: "US" as const, platform: "YouTube" as const, scenario: "Road" as const, format: "Long Review" as const },
  { cell: "us-mtb-youtube", market: "US" as const, platform: "YouTube" as const, scenario: "MTB" as const, format: "Long Review" as const },
  { cell: "uk-urban-youtube", market: "UK" as const, platform: "YouTube" as const, scenario: "Urban" as const, format: "Long Review" as const },
  { cell: "us-road-tiktok", market: "US" as const, platform: "TikTok" as const, scenario: "Road" as const, format: "Short Video" as const },
  { cell: "us-mtb-tiktok", market: "US" as const, platform: "TikTok" as const, scenario: "MTB" as const, format: "Short Video" as const },
  { cell: "uk-urban-instagram", market: "UK" as const, platform: "Instagram" as const, scenario: "Urban" as const, format: "Reel" as const },
];

function createCandidate(index: number, role: "Primary" | "Backup"): CampaignCandidate {
  const segment = segmentTemplates[index % segmentTemplates.length];
  const serial = String(index + 1).padStart(2, "0");
  const creatorFee = segment.platform === "YouTube" ? 18_000 + (index % 5) * 1_500 : 4_000 + (index % 4) * 900;
  const rightsCost = segment.platform === "YouTube" ? 4_000 : 1_000;
  return {
    id: index === 31 ? "creator-over-budget" : `creator-${serial}`,
    creatorName: `${["Cadence", "Switchback", "Cityline", "Peloton", "Trailhead", "Nightshift"][index % 6]} ${serial}`,
    handle: `@ride${serial}`,
    market: segment.market,
    platform: segment.platform,
    ridingScenario: segment.scenario,
    matrixCellId: segment.cell,
    batchId: index < 21 ? "batch-01" : "batch-02",
    evidence: [{
      id: `evidence-${serial}`,
      sourceType: index % 3 === 0 ? "Internal" : "Public",
      sourceUrl: `https://example.com/rides/${serial}`,
      platform: segment.platform,
      publishedAt: `2026-0${(index % 8) + 1}-15`,
      ridingScenario: segment.scenario,
      contentFormat: segment.format,
      views: segment.platform === "YouTube" ? 280_000 + index * 9_000 : 90_000 + index * 4_000,
      proofPoints: segment.platform === "YouTube"
        ? ["Real Cycling", "First-person POV", "Stabilization", "Long-form Explanation"]
        : ["Real Cycling", "First-person POV", index % 2 ? "Low Light" : "Daylight"],
      verifiedAt: "2026-09-20T16:00:00+08:00",
      stale: false,
    }],
    quote: {
      creatorFee: index === 31 ? 54_000 : creatorFee,
      total: index === 31 ? 60_000 : creatorFee + rightsCost,
      currency: "USD",
      deliverables: segment.platform === "YouTube" ? "1 × 8–12 min YouTube review" : `1 × ${segment.format}`,
      availability: "Within confirmed 8-week window",
      paymentTerms: "50% booking / 50% publish",
      validUntil: "2026-10-05",
      status: index % 4 === 0 ? "Received" : "Estimated",
      gmailThreadId: `gmail-thread-${serial}`,
      rights: { usageType: "Paid Ads", territory: "US + UK", durationDays: 90, exclusivity: false, rawFootage: false, cost: rightsCost },
    },
    forecastViews: segment.platform === "YouTube" ? 320_000 + index * 8_000 : 110_000 + index * 3_000,
    scores: { relevance: 76 + (index % 5) * 4, production: 72 + (index % 4) * 5, stability: 70 + (index % 6) * 4, commercial: 68 + (index % 5) * 5, audience: 74 + (index % 4) * 5 },
    role,
    decision: "Unreviewed",
    internalNote: `Internal fit note for creator ${serial}.`,
    historicalPrice: Math.max(2_000, creatorFee - 2_000),
    clientReason: "",
    clientComment: "",
  };
}

const primaryCandidates = Array.from({ length: 30 }, (_, index) => createCandidate(index, "Primary"));
const backupCandidates = Array.from({ length: 10 }, (_, index) => createCandidate(index + 30, "Backup"));
const badCases: CampaignCandidate[] = [
  {
    ...createCandidate(40, "Backup"), id: "creator-moto-only", creatorName: "Torque Atlas", handle: "@torqueatlas", role: "Unassigned", ridingScenario: "Motorcycle",
    evidence: [{ ...createCandidate(40, "Backup").evidence[0], id: "evidence-moto", ridingScenario: "Motorcycle", proofPoints: ["First-person POV", "Stabilization"] }],
    internalNote: "High reach, but no real cycling evidence.",
  },
  {
    ...createCandidate(41, "Backup"), id: "creator-missing-evidence", creatorName: "Open Air Edit", handle: "@openairedit", role: "Unassigned", evidence: [],
    internalNote: "Relevant claim is not supported by a verifiable video.",
  },
];

export const campaignSeed: CampaignState = {
  id: "campaign-cycling-camera",
  name: "Cycling Camera Launch · US / UK",
  brief: {
    id: "brief-v1",
    version: 0,
    status: "Draft",
    publishedAt: null,
    product: "Cycling head-mounted camera",
    markets: ["US", "UK"],
    ridingScenarios: ["Road", "MTB", "Urban"],
    proofPoints: ["First-person footage", "Safety recording", "Stabilization", "Different lighting conditions"],
    budgetCap: 180_000,
    viewsTarget: 2_600_000,
    cpmTarget: 70,
    minimumLongFormCreators: 3,
    firstReviewCount: 30,
    backupCount: 10,
    sources: [
      { id: "source-email", type: "Email", title: "Client brief email", excerpt: "Creators must show real cycling content. YouTube is mandatory." },
      { id: "source-excel", type: "Excel", title: "Budget & timing.xlsx", excerpt: "Budget $180,000 including rights. Go-live in eight weeks." },
      { id: "source-meeting", type: "Meeting Notes", title: "Kickoff notes", excerpt: "Six-week launch mentioned. Motorcycle and skiing proposed but not confirmed." },
    ],
    conflicts: [
      { id: "conflict-launch", field: "launchWindow", label: "Launch window", options: ["6 weeks · Meeting", "8 weeks · Excel"], sourceIds: ["source-excel", "source-meeting"], status: "Unresolved", resolution: null },
      { id: "conflict-sports", field: "adjacentSports", label: "Motorcycle / skiing scope", options: ["Include", "Pending; excluded from current plan"], sourceIds: ["source-email", "source-meeting"], status: "Unresolved", resolution: null },
    ],
  },
  matrixScenarios: [
    { id: "scenario-a", name: "Credibility First", strategy: "Lead with four long-form YouTube proofs across road, trail and commuting.", briefVersionId: "brief-v1", version: 0, status: "Draft", lockedAt: null, rows: scenarioARows },
    { id: "scenario-b", name: "Reach Efficiency", strategy: "Protect long-form coverage while shifting more spend into short-form reach.", briefVersionId: "brief-v1", version: 0, status: "Draft", lockedAt: null, rows: scenarioBRows },
  ],
  activeScenarioId: "scenario-a",
  searchPackages: [],
  batches: [
    { id: "batch-01", packageIds: [], sourceType: "Internal", createdAt: "2026-09-20T10:00:00+08:00", resultCount: 21, note: "Existing creator and historical inquiry records." },
    { id: "batch-02", packageIds: [], sourceType: "Public", createdAt: "2026-09-20T14:00:00+08:00", resultCount: 21, note: "Compliant public profile and video snapshots." },
  ],
  candidates: [...primaryCandidates, ...backupCandidates, ...badCases],
  candidatesLoaded: false,
  reviewRound: null,
  gapAssessment: null,
  activity: [{ id: "activity-created", at: "2026-09-21T08:30:00+08:00", kind: "Campaign", message: "Cycling camera planning workspace created", status: "Info" }],
};
