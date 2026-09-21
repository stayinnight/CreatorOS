import type { CampaignCandidate, Qualification, SearchPackage } from "./model";
import { calculateFitScore, qualifyCandidateDetailed } from "./qualification";

export function qualifyCandidate(candidate: CampaignCandidate, searchPackage: SearchPackage): Qualification {
  const result = qualifyCandidateDetailed(candidate, searchPackage);
  return { status: result.status, reasons: result.gates.filter((item) => item.status !== "Pass").map((item) => item.summary), risks: result.risks };
}

export function candidateScore(candidate: CampaignCandidate) {
  return calculateFitScore(candidate);
}
