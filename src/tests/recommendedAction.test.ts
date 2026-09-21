import { describe, expect, it } from "vitest";
import { getActionLifecycle, getRecommendedNextAction } from "../agent/recommendedAction";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";

function reachMix() {
  let state = structuredClone(campaignSeed);
  state = campaignReducer(state, { type: "LOAD_DEMO_MATERIALS" });
  state = campaignReducer(state, { type: "START_AGENT_RUN" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-launch", value: "8 weeks · Excel" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-sports", value: "Pending; excluded from current plan" });
  return campaignReducer(state, { type: "GENERATE_MIX_OPTIONS" });
}

describe("recommended campaign action", () => {
  it("moves from Matrix lock to packages to calibration", () => {
    let state = reachMix();
    expect(getRecommendedNextAction(state)?.id).toBe("lock-matrix");

    state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: state.activeScenarioId });
    expect(getRecommendedNextAction(state)?.id).toBe("generate-packages");

    state = campaignReducer(state, { type: "GENERATE_PACKAGES", scenarioId: state.activeScenarioId });
    expect(getRecommendedNextAction(state)?.id).toBe("start-calibration");
  });

  it("replaces lock with constraint review when the Matrix fails", () => {
    let state = reachMix();
    state = campaignReducer(state, { type: "SIMULATE_LONG_FORM_GAP", scenarioId: state.activeScenarioId });
    expect(getRecommendedNextAction(state)?.id).toBe("review-matrix");
  });

  it("retires actions after their transition", () => {
    let state = reachMix();
    state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: state.activeScenarioId });
    expect(getActionLifecycle(state, "lock-matrix")).toBe("Completed");
    expect(getActionLifecycle(state, "generate-packages")).toBe("Current");
  });

  it("keeps approval and recovery recommendations directly executable", () => {
    let state = reachMix();
    state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: state.activeScenarioId });
    state = campaignReducer(state, { type: "GENERATE_PACKAGES", scenarioId: state.activeScenarioId });
    state = campaignReducer(state, { type: "START_SOURCING" });
    expect(getRecommendedNextAction(state)?.command).toEqual({ kind: "dispatch", action: { type: "APPROVE_CALIBRATION" } });

    state = campaignReducer(state, { type: "APPROVE_CALIBRATION" });
    expect(getRecommendedNextAction(state)?.id).toBe("validate-slate");
  });
});
