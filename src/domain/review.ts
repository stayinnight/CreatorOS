import type { CampaignCandidate, ClientCandidate, Qualification } from "./model";

export function toClientCandidate(candidate: CampaignCandidate): ClientCandidate {
  const quoteFloor = Math.round(candidate.quote.total * 0.9 / 1000) * 1000;
  const quoteCeiling = Math.round(candidate.quote.total * 1.1 / 1000) * 1000;
  return {
    id: candidate.id,
    creatorName: candidate.creatorName,
    handle: candidate.handle,
    market: candidate.market,
    platform: candidate.platform,
    ridingScenario: candidate.ridingScenario,
    forecastViews: candidate.forecastViews,
    deliverables: candidate.quote.deliverables,
    quoteRange: `$${quoteFloor.toLocaleString()}–$${quoteCeiling.toLocaleString()}`,
    rightsSummary: `${candidate.quote.rights.durationDays}-day ${candidate.quote.rights.usageType.toLowerCase()} · ${candidate.quote.rights.territory}`,
    evidence: candidate.evidence.map((evidence) => ({
      id: evidence.id,
      sourceType: evidence.sourceType,
      sourceUrl: evidence.sourceUrl,
      platform: evidence.platform,
      publishedAt: evidence.publishedAt,
      ridingScenario: evidence.ridingScenario,
      contentFormat: evidence.contentFormat,
      views: evidence.views,
      proofPoints: [...evidence.proofPoints],
      verifiedAt: evidence.verifiedAt,
      stale: evidence.stale,
    })),
    decision: candidate.decision,
    clientReason: candidate.clientReason,
    clientComment: candidate.clientComment,
  };
}

export function validateReviewRound(
  primaries: CampaignCandidate[],
  backups: CampaignCandidate[],
  qualificationByCandidateId: Record<string, Qualification>,
) {
  const errors: string[] = [];
  if (primaries.length !== 30) errors.push(`Client round requires 30 candidates; found ${primaries.length}`);
  if (backups.length < 10) errors.push(`Internal pool requires 10 backups; found ${backups.length}`);
  if (primaries.some((candidate) => qualificationByCandidateId[candidate.id]?.status !== "Qualified")) errors.push("All client candidates must be qualified");
  if (backups.some((candidate) => qualificationByCandidateId[candidate.id]?.status !== "Qualified")) errors.push("All backup candidates must be qualified");
  return { valid: errors.length === 0, errors };
}
