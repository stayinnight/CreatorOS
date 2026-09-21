import type { CampaignCandidate, FitScore, GateResult, QualificationResult, SearchPackage } from "./model";

const weights = { relevance: 30, povEvidence: 25, production: 15, stability: 15, commercial: 10, audience: 5 } as const;

function gate(id: GateResult["id"], label: string, status: GateResult["status"], ruleId: string, evidenceIds: string[], summary: string): GateResult {
  return { id, label, status, ruleId, evidenceIds, summary };
}

function povEvidenceScore(candidate: CampaignCandidate) {
  const proof = new Set(candidate.evidence.flatMap((item) => item.proofPoints));
  return Math.min(100,
    (proof.has("Real Cycling") ? 10 : 0) +
    (proof.has("First-person POV") ? 35 : 0) +
    (proof.has("Stabilization") ? 25 : 0) +
    (proof.has("Low Light") ? 15 : 0) +
    (proof.has("Hands-free Mounting") ? 15 : 0));
}

export function calculateFitScore(candidate: CampaignCandidate): FitScore {
  const raw = {
    relevance: candidate.scores.relevance,
    povEvidence: povEvidenceScore(candidate),
    production: candidate.scores.production,
    stability: candidate.scores.stability,
    commercial: candidate.scores.commercial,
    audience: candidate.scores.audience,
  };
  const breakdown = {
    relevance: raw.relevance * .30,
    povEvidence: raw.povEvidence * .25,
    production: raw.production * .15,
    stability: raw.stability * .15,
    commercial: raw.commercial * .10,
    audience: raw.audience * .05,
  };
  return { total: Object.values(breakdown).reduce((sum, value) => sum + value, 0), weights, breakdown };
}

export function scoreQualifiedCandidate(candidate: CampaignCandidate, result: QualificationResult) {
  return result.status === "Qualified" ? calculateFitScore(candidate) : null;
}

export function qualifyCandidateDetailed(candidate: CampaignCandidate, searchPackage: SearchPackage): QualificationResult {
  const evidenceIds = candidate.evidence.map((item) => item.id);
  const currentEvidence = candidate.evidence.filter((item) => !item.stale);
  const realCycling = candidate.evidence.filter((item) => item.proofPoints.includes("Real Cycling"));
  const scenarioEvidence = realCycling.filter((item) => item.ridingScenario === searchPackage.ridingScenario);
  const cameraEvidence = candidate.evidence.filter((item) => item.proofPoints.some((point) => ["First-person POV", "Stabilization", "Low Light", "Hands-free Mounting"].includes(point)));
  const hasEvidence = candidate.evidence.length > 0;
  const quoteReview = candidate.quote.total > searchPackage.budgetCeilingPerCreator || candidate.quote.status === "Estimated";
  const gates: GateResult[] = [
    gate("market", "目标市场", candidate.market === searchPackage.market ? "Pass" : "Fail", "brief.market", evidenceIds, candidate.market === searchPackage.market ? `符合 ${searchPackage.market} 市场` : `候选市场 ${candidate.market} 不符合 ${searchPackage.market}`),
    gate("platform-format", "平台与内容形式", candidate.platform !== searchPackage.platform ? "Fail" : !hasEvidence ? "Review" : candidate.evidence.some((item) => item.platform === searchPackage.platform && item.contentFormat === searchPackage.contentFormat) ? "Pass" : "Review", "matrix.platform-format", evidenceIds, candidate.platform === searchPackage.platform ? `平台为 ${candidate.platform}` : `平台不符合 ${searchPackage.platform}`),
    gate("real-cycling", "真实自行车骑行", !hasEvidence ? "Review" : realCycling.length ? "Pass" : "Fail", "brief.real-cycling", realCycling.map((item) => item.id), !hasEvidence ? "缺少可核验内容证据" : realCycling.length ? "存在真实自行车骑行证据" : "没有真实自行车骑行证据"),
    gate("scenario", "目标骑行场景", !hasEvidence ? "Review" : scenarioEvidence.length ? "Pass" : "Fail", "matrix.riding-scenario", scenarioEvidence.map((item) => item.id), scenarioEvidence.length ? `已验证 ${searchPackage.ridingScenario} 场景` : `没有 ${searchPackage.ridingScenario} 场景证据`),
    gate("head-camera-proof", "头戴摄像头适配", !hasEvidence || !cameraEvidence.length ? "Review" : "Pass", "brief.head-camera-proof", cameraEvidence.map((item) => item.id), cameraEvidence.length ? "包含 POV、稳定性、弱光或免手持证据" : "缺少头戴摄像头表现证据"),
    gate("commercial", "版权、档期与预算", quoteReview ? "Review" : "Pass", "matrix.commercial", [], quoteReview ? "报价超出单元格上限或仍为估价" : "报价和档期可执行"),
  ];
  const hardFailure = gates.some((item) => item.status === "Fail");
  const needsReview = gates.some((item) => item.status === "Review");
  const status = hardFailure ? "Disqualified" : needsReview ? "Needs Review" : "Qualified";
  const risks = gates.filter((item) => item.status === "Review").map((item) => item.summary);
  const confidence = !hasEvidence ? "Low" : currentEvidence.length === candidate.evidence.length ? "High" : "Medium";
  const partial = { candidateId: candidate.id, status, confidence, gates, evidenceIds, risks, score: null } satisfies QualificationResult;
  return { ...partial, score: scoreQualifiedCandidate(candidate, partial) };
}
