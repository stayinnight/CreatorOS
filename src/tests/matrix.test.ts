import { describe, expect, it } from "vitest";
import { campaignSeed } from "../data/seed";
import { calculateRow, evaluateMatrix, lockMatrix, summarizeMatrix } from "../domain/matrix";

const publishedBrief = {
  ...campaignSeed.brief,
  version: 1,
  status: "Published" as const,
  conflicts: campaignSeed.brief.conflicts.map((conflict) => ({ ...conflict, status: "Resolved" as const })),
};

describe("Matrix engine", () => {
  it("calculates row cost, views, and CPM", () => {
    const row = campaignSeed.matrixScenarios[0].rows[0];
    expect(calculateRow(row)).toEqual({ cost: 64_000, expectedViews: 1_000_000, cpm: 64 });
  });

  it("reconciles both business scenarios with blended CPM", () => {
    const credibility = summarizeMatrix(campaignSeed.matrixScenarios[0].rows);
    expect(credibility.totalCost).toBe(172_000);
    expect(credibility.totalExpectedViews).toBe(2_750_000);
    expect(credibility.blendedCpm).toBeCloseTo(62.55, 2);

    const reach = summarizeMatrix(campaignSeed.matrixScenarios[1].rows);
    expect(reach.totalCost).toBe(167_000);
    expect(reach.totalExpectedViews).toBe(3_250_000);
    expect(reach.blendedCpm).toBeCloseTo(51.38, 2);
  });

  it("passes all blocking rules for the credibility scenario", () => {
    expect(evaluateMatrix(campaignSeed.matrixScenarios[0].rows, publishedBrief).filter((item) => item.status === "fail")).toEqual([]);
  });

  it("keeps long-form and coverage rules independent", () => {
    const rows = campaignSeed.matrixScenarios[0].rows.map((row) => row.market === "UK"
      ? { ...row, plannedCreators: 0 }
      : row.contentFormat === "Long Review" && row.ridingScenario === "MTB"
        ? { ...row, plannedCreators: 0 }
        : row);
    const failures = evaluateMatrix(rows, publishedBrief).filter((item) => item.status === "fail").map((item) => item.id);
    expect(failures).toContain("long-form");
    expect(failures).toContain("markets");
  });

  it("counts rights inside the same budget", () => {
    const row = campaignSeed.matrixScenarios[0].rows[0];
    const increased = calculateRow({ ...row, rightsCost: row.rightsCost + 1_000 });
    expect(increased.cost - calculateRow(row).cost).toBe(row.plannedCreators * 1_000);
  });

  it("blocks lock until the Brief and Matrix both pass", () => {
    expect(() => lockMatrix(campaignSeed.matrixScenarios[0], campaignSeed.brief)).toThrow("Brief conflicts");
    const locked = lockMatrix(campaignSeed.matrixScenarios[0], publishedBrief);
    expect(locked).toMatchObject({ status: "Locked", version: 1, lockedAt: "2026-09-21T10:00:00+08:00" });
  });
});
