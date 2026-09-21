import { describe, expect, it } from "vitest";
import { campaignSeed } from "../data/seed";
import { generateSearchPackages } from "../domain/search";
import { qualifyCandidateDetailed, scoreQualifiedCandidate } from "../domain/qualification";

const packages = generateSearchPackages({ ...campaignSeed.matrixScenarios[0], status: "Locked", version: 1 });

function qualificationFor(id: string) {
  const candidate = campaignSeed.candidates.find((item) => item.id === id)!;
  const searchPackage = packages.find((item) => item.matrixCellId === candidate.matrixCellId)!;
  return { candidate, result: qualifyCandidateDetailed(candidate, searchPackage) };
}

describe("evidence qualification", () => {
  it("disqualifies motorcycle-only proof even when production is high", () => {
    const { candidate, result } = qualificationFor("creator-moto-only");
    expect(result.status).toBe("Disqualified");
    expect(result.gates.find((gate) => gate.id === "real-cycling")?.status).toBe("Fail");
    expect(scoreQualifiedCandidate(candidate, result)).toBeNull();
  });

  it("routes missing evidence to review", () => {
    expect(qualificationFor("creator-missing-evidence").result.status).toBe("Needs Review");
  });

  it("routes an over-budget candidate to commercial review", () => {
    const result = qualificationFor("creator-over-budget").result;
    expect(result.status).toBe("Needs Review");
    expect(result.gates.find((gate) => gate.id === "commercial")?.status).toBe("Review");
  });

  it("uses the 30/25/15/15/10/5 fit weights only after qualification", () => {
    const candidate = campaignSeed.candidates.find((item) => item.id === "creator-01")!;
    const searchPackage = packages.find((item) => item.matrixCellId === candidate.matrixCellId)!;
    const result = qualifyCandidateDetailed(candidate, searchPackage);
    const score = scoreQualifiedCandidate(candidate, result)!;
    expect(score.weights).toEqual({ relevance: 30, povEvidence: 25, production: 15, stability: 15, commercial: 10, audience: 5 });
    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.total).toBeLessThanOrEqual(100);
  });
});
