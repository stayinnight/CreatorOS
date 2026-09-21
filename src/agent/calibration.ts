import { candidateScore, qualifyCandidate } from "../domain/candidate";
import type { CampaignCandidate, SearchPackage } from "../domain/model";

export function buildCalibrationBatch(candidates: CampaignCandidate[], packageByCell: Map<string, SearchPackage>) {
  const qualified = candidates
    .filter((candidate) => candidate.role !== "Unassigned")
    .filter((candidate) => {
      const searchPackage = packageByCell.get(candidate.matrixCellId);
      return searchPackage && qualifyCandidate(candidate, searchPackage).status === "Qualified";
    })
    .sort((a, b) => candidateScore(b).total - candidateScore(a).total)
    .slice(0, 8);
  const failureCases = ["creator-moto-only", "creator-missing-evidence"].map((id) => candidates.find((candidate) => candidate.id === id)!).filter(Boolean);
  return [...qualified, ...failureCases];
}

export function preferenceForReason(reason: string) {
  if (reason === "Too commercial") return "Prefer lifestyle-led cycling proof";
  if (reason === "Quote too high") return "Prefer candidates within Matrix cell ceiling";
  if (reason === "Style mismatch") return "Prefer natural first-person riding narratives";
  return "Require verified real-cycling evidence";
}
