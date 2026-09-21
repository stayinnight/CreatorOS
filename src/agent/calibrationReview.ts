import type { CampaignCandidate, QualificationResult } from "../domain/model";
import { calculateFitScore } from "../domain/qualification";
import type { CalibrationReview, CampaignPreference, PreferenceImpact, RejectReason } from "./model";

const preferenceCopy: Record<RejectReason, { id: string; label: string; strength: number }> = {
  "No real cycling": { id: "require-real-cycling", label: "Require verified real-cycling evidence", strength: 100 },
  "Too commercial": { id: "prefer-lifestyle", label: "Prefer lifestyle-led cycling proof", strength: 12 },
  "Not enough POV evidence": { id: "prefer-pov", label: "Prefer strong first-person POV evidence", strength: 15 },
  "Audience mismatch": { id: "prefer-audience", label: "Prefer audience alignment", strength: 10 },
  "Quote too high": { id: "prefer-budget", label: "Prefer candidates within Matrix cell ceiling", strength: 20 },
};

export function previewRejectImpact(candidateId: string, reason: RejectReason, candidates: CampaignCandidate[]): PreferenceImpact {
  const source = candidates.find((item) => item.id === candidateId);
  const setting = preferenceCopy[reason];
  return {
    ...setting,
    kind: reason === "No real cycling" ? "QualificationCorrection" : "SoftPreference",
    candidateId,
    reason,
    affectedCandidateIds: source ? candidates.filter((item) => item.matrixCellId === source.matrixCellId).map((item) => item.id) : [],
  };
}

export function applyPreference(preferences: CampaignPreference[], impact: PreferenceImpact) {
  if (impact.kind === "QualificationCorrection") return preferences;
  const next = { id: impact.id, label: impact.label, strength: impact.strength, affectedCandidateIds: impact.affectedCandidateIds };
  return [...preferences.filter((item) => item.id !== impact.id), next];
}

function preferencePenalty(candidate: CampaignCandidate, preferences: CampaignPreference[]) {
  return preferences.reduce((sum, preference) => {
    if (!preference.affectedCandidateIds.includes(candidate.id)) return sum;
    if (preference.id === "prefer-lifestyle") return sum + (candidate.scores.commercial / 100) * preference.strength;
    if (preference.id === "prefer-pov") return sum + (100 - calculateFitScore(candidate).breakdown.povEvidence * 4) / 100 * preference.strength;
    if (preference.id === "prefer-audience") return sum + (100 - candidate.scores.audience) / 100 * preference.strength;
    if (preference.id === "prefer-budget") return sum + preference.strength;
    return sum;
  }, 0);
}

export function rankCandidates(candidates: CampaignCandidate[], preferences: CampaignPreference[]) {
  return candidates.map((candidate, index) => ({ candidate, index, score: calculateFitScore(candidate).total - preferencePenalty(candidate, preferences) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.candidate);
}

export function getCalibrationReadiness(reviews: CalibrationReview[], qualificationById: Record<string, QualificationResult>, preferenceConfirmed: boolean) {
  const reviewed = new Set(reviews.map((item) => item.candidateId)).size;
  const acceptedQualified = reviews.filter((item) => item.decision === "Accepted" && qualificationById[item.candidateId]?.status === "Qualified").length;
  const reviewedFailure = reviews.some((item) => qualificationById[item.candidateId]?.status !== "Qualified");
  const blockers = [reviewed < 3 && "至少审阅 3 人", acceptedQualified < 2 && "至少接受 2 名 Qualified 候选", !reviewedFailure && "至少审阅 1 个失败样本", !preferenceConfirmed && "应用偏好或确认无需调整"].filter(Boolean) as string[];
  return { ready: blockers.length === 0, reviewed, acceptedQualified, reviewedFailure, preferenceConfirmed, blockers };
}

export function buildApprovedSlate(candidates: CampaignCandidate[], qualificationById: Record<string, QualificationResult>, preferences: CampaignPreference[], reviews: CalibrationReview[]) {
  const accepted = new Set(reviews.filter((item) => item.decision === "Accepted").map((item) => item.candidateId));
  const eligible = candidates.filter((candidate) => {
    const result = qualificationById[candidate.id];
    const commercialOnlyReview = result?.status === "Needs Review" && result.gates.filter((item) => item.status === "Review").every((item) => item.id === "commercial");
    return candidate.role !== "Unassigned" && (result?.status === "Qualified" || commercialOnlyReview || (result?.status === "Needs Review" && accepted.has(candidate.id)));
  });
  const ranked = rankCandidates(eligible, preferences).slice(0, 40);
  if (ranked.length < 40) return { primaryIds: [], backupIds: [], error: `Only ${ranked.length} eligible candidates; 40 required` };
  return { primaryIds: ranked.slice(0, 30).map((item) => item.id), backupIds: ranked.slice(30).map((item) => item.id), error: null };
}
