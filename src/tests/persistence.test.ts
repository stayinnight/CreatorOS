import { beforeEach, describe, expect, it } from "vitest";
import { campaignSeed } from "../data/seed";
import { loadState, resetState, saveState } from "../data/persistence";

describe("local campaign persistence", () => {
  beforeEach(() => localStorage.clear());

  it("restores and resets deterministic campaign state", () => {
    saveState({ ...campaignSeed, activeScenarioId: "scenario-b" });
    expect(loadState()?.activeScenarioId).toBe("scenario-b");
    resetState();
    expect(loadState()).toBeNull();
  });

  it("rejects malformed local data instead of booting corrupt state", () => {
    localStorage.setItem("creator-mix-planner:v2", JSON.stringify({ id: "broken" }));
    expect(loadState()).toBeNull();
    expect(localStorage.getItem("creator-mix-planner:v2")).toBeNull();
  });

  it("does not load v1 state and reset removes both storage generations", () => {
    localStorage.setItem("creator-mix-planner:v1", JSON.stringify(campaignSeed));
    expect(loadState()).toBeNull();
    saveState(campaignSeed);
    resetState();
    expect(localStorage.getItem("creator-mix-planner:v1")).toBeNull();
    expect(localStorage.getItem("creator-mix-planner:v2")).toBeNull();
  });
});
