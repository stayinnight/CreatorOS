import { describe, expect, it } from "vitest";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";

function reachMix(state = structuredClone(campaignSeed)) {
  state = campaignReducer(state, { type: "LOAD_DEMO_MATERIALS" });
  state = campaignReducer(state, { type: "START_AGENT_RUN" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-launch", value: "8 weeks · Excel" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-sports", value: "Pending; excluded from current plan" });
  return campaignReducer(state, { type: "GENERATE_MIX_OPTIONS" });
}

describe("Agent Matrix artifact", () => {
  it("blocks an invalid lock, restores the mix, then records locked downstream artifacts", () => {
    let state = reachMix();
    expect(state.agent.messages.at(-1)?.text).toContain("two creator mix options");

    state = campaignReducer(state, { type: "SIMULATE_LONG_FORM_GAP", scenarioId: "scenario-a" });
    state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: "scenario-a" });
    expect(state.matrixScenarios[0].status).toBe("Draft");
    expect(state.agent.messages.at(-1)?.type).toBe("Exception");

    state = campaignReducer(state, { type: "RESTORE_SCENARIO", scenarioId: "scenario-a" });
    state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: "scenario-a" });
    expect(state.agent.artifacts).toContainEqual(expect.objectContaining({ kind: "Mix", status: "Locked" }));

    state = campaignReducer(state, { type: "GENERATE_PACKAGES", scenarioId: "scenario-a" });
    expect(state.agent.artifacts).toContainEqual(expect.objectContaining({ kind: "SearchPackageSet", parentArtifactIds: ["artifact-mix-v1"] }));
  });
});
