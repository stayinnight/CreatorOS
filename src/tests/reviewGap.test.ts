import { describe, expect, it } from "vitest";
import { campaignSeed } from "../data/seed";
import { qualifyCandidate } from "../domain/candidate";
import { assessGap, recommendGapAction } from "../domain/gap";
import { generateSearchPackages } from "../domain/search";
import { validateReviewRound } from "../domain/review";

const lockedMatrix = { ...campaignSeed.matrixScenarios[0], status: "Locked" as const, version: 1 };
const packages = generateSearchPackages(lockedMatrix);
const packageByCell = new Map(packages.map((item) => [item.matrixCellId, item]));
const qualifications = Object.fromEntries(campaignSeed.candidates.map((candidate) => [candidate.id, qualifyCandidate(candidate, packageByCell.get(candidate.matrixCellId)!)]));
const qualifiedCandidates = campaignSeed.candidates.filter((candidate) => qualifications[candidate.id].status === "Qualified");

describe("review round and feedback gap", () => {
  it("requires exactly 30 qualified primaries and at least 10 qualified backups", () => {
    const primaries = qualifiedCandidates.filter((candidate) => candidate.role === "Primary");
    const backups = qualifiedCandidates.filter((candidate) => candidate.role === "Backup");
    expect(validateReviewRound(primaries.slice(0, 29), backups, qualifications).valid).toBe(false);
    expect(validateReviewRound(primaries, backups, qualifications).valid).toBe(true);
  });

  it("finds a UK Urban gap and chooses the least destructive action", () => {
    const primaries = qualifiedCandidates.filter((candidate) => candidate.role === "Primary");
    const backups = qualifiedCandidates.filter((candidate) => candidate.role === "Backup");
    const withClientPasses = primaries.map((candidate) => candidate.market === "UK" && candidate.ridingScenario === "Urban"
      ? { ...candidate, decision: "Pass" as const }
      : { ...candidate, decision: "Select" as const });
    const gap = assessGap(lockedMatrix, withClientPasses, backups);
    expect(gap.missingCells).toContainEqual(expect.objectContaining({ market: "UK", ridingScenario: "Urban" }));
    expect(recommendGapAction(gap, backups).action).toBe("Promote Backup");
    expect(recommendGapAction(gap, []).action).toBe("Replenish");
  });
});
