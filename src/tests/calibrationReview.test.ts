import { describe, expect, it } from "vitest";
import { campaignSeed } from "../data/seed";
import { generateSearchPackages } from "../domain/search";
import { qualifyCandidateDetailed } from "../domain/qualification";
import { applyPreference, buildApprovedSlate, getCalibrationReadiness, previewRejectImpact } from "../agent/calibrationReview";
import type { CalibrationReview } from "../agent/model";

const packages = generateSearchPackages({ ...campaignSeed.matrixScenarios[0], status: "Locked", version: 1 });
const packageByCell = new Map(packages.map((item) => [item.matrixCellId, item]));
const qualificationById = Object.fromEntries(campaignSeed.candidates.map((candidate) => [candidate.id, qualifyCandidateDetailed(candidate, packageByCell.get(candidate.matrixCellId)!)]));

describe("calibration review", () => {
  it("requires 3 reviews, 2 accepted qualified candidates, one failure and preference confirmation", () => {
    const reviews: CalibrationReview[] = [
      { candidateId: "creator-01", decision: "Accepted", reason: null, reviewedAt: "now" },
      { candidateId: "creator-02", decision: "Accepted", reason: null, reviewedAt: "now" },
      { candidateId: "creator-moto-only", decision: "Rejected", reason: "No real cycling", reviewedAt: "now" },
    ];
    expect(getCalibrationReadiness(reviews, qualificationById, true).ready).toBe(true);
  });

  it("applies the same preference idempotently", () => {
    const impact = previewRejectImpact("creator-05", "Too commercial", campaignSeed.candidates);
    expect(applyPreference(applyPreference([], impact), impact)).toHaveLength(1);
  });

  it("treats no-real-cycling as a qualification correction", () => {
    expect(previewRejectImpact("creator-05", "No real cycling", campaignSeed.candidates).kind).toBe("QualificationCorrection");
  });

  it("builds exactly 30 primary and 10 backup candidates", () => {
    const reviews: CalibrationReview[] = [{ candidateId: "creator-over-budget", decision: "Accepted", reason: null, reviewedAt: "now" }];
    const slate = buildApprovedSlate(campaignSeed.candidates, qualificationById, [], reviews);
    expect(slate.primaryIds).toHaveLength(30);
    expect(slate.backupIds).toHaveLength(10);
    expect(new Set([...slate.primaryIds, ...slate.backupIds]).size).toBe(40);
  });
});
