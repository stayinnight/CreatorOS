import { describe, expect, it } from "vitest";
import { campaignSeed } from "../data/seed";
import { parseCampaignSeed } from "../data/seedSchema";

describe("campaign seed", () => {
  it("contains the complete deterministic review pool", () => {
    const campaign = parseCampaignSeed(campaignSeed);
    expect(campaign.candidates).toHaveLength(42);
    expect(campaign.candidates.filter((candidate) => candidate.role === "Primary")).toHaveLength(30);
    expect(campaign.candidates.filter((candidate) => candidate.role === "Backup")).toHaveLength(10);
    expect(campaign.candidates.filter((candidate) => candidate.role === "Unassigned")).toHaveLength(2);
    expect(campaign.brief.conflicts.map((item) => item.field)).toEqual(["launchWindow", "adjacentSports"]);
    expect(campaign.matrixScenarios).toHaveLength(2);
    expect(campaign.searchPackages).toEqual([]);
  });
});
