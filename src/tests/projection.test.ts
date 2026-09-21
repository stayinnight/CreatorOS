import { describe, expect, it } from "vitest";
import { campaignSeed } from "../data/seed";
import { toClientCandidate } from "../domain/review";

describe("client projection", () => {
  it("never projects internal commercial fields to the client", () => {
    const internalCandidate = campaignSeed.candidates[0];
    const projected = toClientCandidate(internalCandidate);
    expect(projected).not.toHaveProperty("historicalPrice");
    expect(projected).not.toHaveProperty("internalNote");
    expect(projected).not.toHaveProperty("role");
    expect(projected).not.toHaveProperty("scores");
    expect(projected).not.toHaveProperty("gmailThreadId");
    expect(projected).toMatchObject({ creatorName: internalCandidate.creatorName, decision: "Unreviewed" });
  });
});
