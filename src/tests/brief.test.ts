import { describe, expect, it } from "vitest";
import { campaignSeed } from "../data/seed";
import { publishBrief, resolveConflict } from "../domain/brief";

describe("Brief publication", () => {
  it("blocks unresolved conflicts", () => {
    expect(() => publishBrief(campaignSeed.brief)).toThrow("Resolve 2 blocking conflicts");
  });

  it("publishes an immutable version after resolution", () => {
    const withWindow = resolveConflict(campaignSeed.brief, "conflict-launch", "8 weeks");
    const resolved = resolveConflict(withWindow, "conflict-sports", "Pending; excluded from current plan");
    const published = publishBrief(resolved);
    expect(published.version).toBe(1);
    expect(published.status).toBe("Published");
    expect(published.publishedAt).toBe("2026-09-21T09:00:00+08:00");
    expect(campaignSeed.brief.status).toBe("Draft");
  });
});
