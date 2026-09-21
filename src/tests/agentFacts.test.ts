import { describe, expect, it } from "vitest";
import { answerCampaignFact } from "../agent/facts";
import { campaignSeed } from "../data/seed";

describe("Campaign facts", () => {
  it("answers facts from the active state", () => {
    expect(answerCampaignFact(campaignSeed, "预算是多少")?.body).toContain("$180,000");
    expect(answerCampaignFact(campaignSeed, "市场有哪些")?.body).toContain("US + UK");
    expect(answerCampaignFact(campaignSeed, "证据要求")?.body).toContain("First-person footage");
  });
});
