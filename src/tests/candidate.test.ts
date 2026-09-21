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
    expect(result.reasons).toContain("没有真实自行车骑行证据");
  });

  it("flags missing evidence for human review", () => {
    const candidate = campaignSeed.candidates.find((item) => item.id === "creator-missing-evidence")!;
    const pkg = packages.find((item) => item.matrixCellId === candidate.matrixCellId)!;
    expect(qualifyCandidate(candidate, pkg).status).toBe("Needs Review");
  });

  it("keeps an over-budget but relevant creator visible for commercial review", () => {
    const candidate = campaignSeed.candidates.find((item) => item.id === "creator-over-budget")!;
    const pkg = packages.find((item) => item.matrixCellId === candidate.matrixCellId)!;
    const result = qualifyCandidate(candidate, pkg);
    expect(result.status).toBe("Needs Review");
    expect(result.risks).toContain("报价超出单元格上限或仍为估价");
  });

  it("uses the published transparent score weights", () => {
    const candidate = campaignSeed.candidates[0];
    expect(candidateScore(candidate).weights).toEqual({ relevance: 30, povEvidence: 25, production: 15, stability: 15, commercial: 10, audience: 5 });
  });
});
