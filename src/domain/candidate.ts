import type { CampaignCandidate, Qualification, SearchPackage } from "./model";

export function qualifyCandidate(candidate: CampaignCandidate, searchPackage: SearchPackage): Qualification {
  if (candidate.evidence.length === 0) {
    return { status: "Needs Review", reasons: ["No verifiable content evidence"], risks: [] };
  }

  const hasCyclingEvidence = candidate.evidence.some((item) => item.proofPoints.includes("Real Cycling"));
  if (!hasCyclingEvidence) {
    return { status: "Disqualified", reasons: ["No verified real-cycling evidence"], risks: [] };
  }

  const hasScenarioEvidence = candidate.evidence.some((item) => item.ridingScenario === searchPackage.ridingScenario);
  if (!hasScenarioEvidence) {
    return { status: "Needs Review", reasons: ["No evidence for target riding scenario"], risks: [] };
  }

  if (candidate.platform !== searchPackage.platform) {
    return { status: "Needs Review", reasons: ["Platform does not match search package"], risks: [] };
  }

  const risks: string[] = [];
  if (candidate.quote.total > searchPackage.budgetCeilingPerCreator) risks.push("Quote exceeds Matrix cell ceiling");
  if (candidate.quote.status === "Estimated") risks.push("Quote is an estimate, not a current offer");
  return { status: "Qualified", reasons: [], risks };
}

export function candidateScore(candidate: CampaignCandidate) {
  const breakdown = {
    relevance: candidate.scores.relevance * 0.35,
    production: candidate.scores.production * 0.2,
    stability: candidate.scores.stability * 0.2,
    commercial: candidate.scores.commercial * 0.15,
    audience: candidate.scores.audience * 0.1,
  };
  return { total: Object.values(breakdown).reduce((sum, value) => sum + value, 0), breakdown };
}
