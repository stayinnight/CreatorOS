import { describe, expect, it } from "vitest";
import { campaignSeed } from "../data/seed";
import { candidateScore, qualifyCandidate } from "../domain/candidate";
import { generateSearchPackages } from "../domain/search";

const packages = generateSearchPackages({ ...campaignSeed.matrixScenarios[0], status: "Locked", version: 1 });

describe("candidate qualification", () => {
  it("rejects high-reach creators without real cycling evidence", () => {
    const candidate = campaignSeed.candidates.find((item) => item.id === "creator-moto-only")!;
    const pkg = packages.find((item) => item.matrixCellId === candidate.matrixCellId)!;
    const result = qualifyCandidate(candidate, pkg);
    expect(result.status).toBe("Disqualified");
    expect(result.reasons).toContain("No verified real-cycling evidence");
  });

  it("flags missing evidence for human review", () => {
    const candidate = campaignSeed.candidates.find((item) => item.id === "creator-missing-evidence")!;
    const pkg = packages.find((item) => item.matrixCellId === candidate.matrixCellId)!;
    expect(qualifyCandidate(candidate, pkg).status).toBe("Needs Review");
  });

  it("keeps an over-budget but relevant creator visible as commercial risk", () => {
    const candidate = campaignSeed.candidates.find((item) => item.id === "creator-over-budget")!;
    const pkg = packages.find((item) => item.matrixCellId === candidate.matrixCellId)!;
    const result = qualifyCandidate(candidate, pkg);
    expect(result.status).toBe("Qualified");
    expect(result.risks).toContain("Quote exceeds Matrix cell ceiling");
  });

  it("uses the published transparent score weights", () => {
    const candidate = campaignSeed.candidates[0];
    const expected = candidate.scores.relevance * .35 + candidate.scores.production * .2 + candidate.scores.stability * .2 + candidate.scores.commercial * .15 + candidate.scores.audience * .1;
    expect(candidateScore(candidate).total).toBeCloseTo(expected, 5);
  });
});
