import { describe, expect, it } from "vitest";
import { campaignSeed } from "../data/seed";

describe("agent workspace seed", () => {
  it("starts at a bounded campaign intake instead of a pre-completed workflow", () => {
    expect(campaignSeed.agent.activeRunId).toBeNull();
    expect(campaignSeed.agent.runs).toEqual([]);
    expect(campaignSeed.agent.artifacts).toEqual([]);
    expect(campaignSeed.agent.messages).toEqual([
      expect.objectContaining({ type: "Text", role: "Agent", text: expect.stringContaining("客户材料") }),
    ]);
    expect(campaignSeed.agent.availableSources).toHaveLength(3);
  });
});
